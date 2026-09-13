import { getPool, sql } from '../config/database';
import {
  ChatSession,
  ChatMessage,
  ChatEvent,
  ContactMessageLog,
  ShippingRequestLog,
  WaitingShipmentEntry,
  BusinessAccountRequest,
  BusinessAccountStatus,
  NovicaApplication,
  NovicaApplicationStatus,
  MessageDTO,
} from '../types/chat.types';
import { logger } from '../utils/logger';

// ── In-memory fallback (used when SQL Server is unreachable) ──────────────────
const memSessions  = new Map<string, ChatSession>();
const memMessages  = new Map<string, MessageDTO[]>();

let _dbAvailable = false;
let _lastCheckedAt = 0;
// Once the DB is marked unavailable, don't re-attempt a connection on every
// single request — but do retry periodically so a transient failure (e.g. at
// process startup) can self-heal without requiring a full app restart, unlike
// the previous one-shot flag that stuck to `false` for the process's lifetime.
const RECHECK_INTERVAL_MS = 30_000;

/** Called once at startup so the very first request-time check is instant. */
export function setDbAvailable(available: boolean): void {
  _dbAvailable = available;
  _lastCheckedAt = Date.now();
}

export async function isDbAvailable(): Promise<boolean> {
  if (_dbAvailable) return true;
  if (Date.now() - _lastCheckedAt < RECHECK_INTERVAL_MS) return false;
  _lastCheckedAt = Date.now();
  try {
    const pool = await getPool();
    _dbAvailable = pool.connected;
  } catch {
    _dbAvailable = false;
  }
  return _dbAvailable;
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function findOpenSessionByPhone(phone: string): Promise<ChatSession | null> {
  if (!(await isDbAvailable())) {
    for (const s of memSessions.values()) {
      if (s.phone === phone && s.status === 'open') return s;
    }
    return null;
  }
  const pool = await getPool();
  const result = await pool.request()
    .input('phone', sql.NVarChar(30), phone)
    .input('status', sql.NVarChar(50), 'open')
    .query<ChatSession>(`
      SELECT TOP 1
        id, session_id AS sessionId, contact_id AS contactId, phone,
        first_name AS firstName, last_name AS lastName, email,
        service_type AS serviceType, tracking_number AS trackingNumber,
        language, status, assigned_department AS assignedDepartment,
        created_at AS createdAt, updated_at AS updatedAt, closed_at AS closedAt
      FROM chat_sessions
      WHERE phone = @phone AND status = @status
      ORDER BY created_at DESC
    `);
  return result.recordset[0] ?? null;
}

export async function findSessionById(sessionId: string): Promise<ChatSession | null> {
  if (!(await isDbAvailable())) {
    return memSessions.get(sessionId) ?? null;
  }
  const pool = await getPool();
  const result = await pool.request()
    .input('sessionId', sql.NVarChar(100), sessionId)
    .query<ChatSession>(`
      SELECT TOP 1
        id, session_id AS sessionId, contact_id AS contactId, phone,
        first_name AS firstName, last_name AS lastName, email,
        service_type AS serviceType, tracking_number AS trackingNumber,
        language, status, assigned_department AS assignedDepartment,
        created_at AS createdAt, updated_at AS updatedAt, closed_at AS closedAt
      FROM chat_sessions
      WHERE session_id = @sessionId
    `);
  // Fall back to in-memory store in case the session was created while DB was unavailable
  return result.recordset[0] ?? memSessions.get(sessionId) ?? null;
}

export async function findOpenSessionByContactId(contactId: string): Promise<ChatSession | null> {
  if (!(await isDbAvailable())) {
    for (const s of memSessions.values()) {
      if (s.contactId === contactId && s.status === 'open') return s;
    }
    return null;
  }
  const pool = await getPool();
  const result = await pool.request()
    .input('contactId', sql.NVarChar(50), contactId)
    .input('status', sql.NVarChar(50), 'open')
    .query<ChatSession>(`
      SELECT TOP 1
        id, session_id AS sessionId, contact_id AS contactId, phone,
        first_name AS firstName, last_name AS lastName, email,
        service_type AS serviceType, tracking_number AS trackingNumber,
        language, status, assigned_department AS assignedDepartment,
        created_at AS createdAt, updated_at AS updatedAt, closed_at AS closedAt
      FROM chat_sessions
      WHERE contact_id = @contactId AND status = @status
      ORDER BY created_at DESC
    `);
  return result.recordset[0] ?? null;
}

export async function createSession(session: Omit<ChatSession, 'id' | 'createdAt' | 'updatedAt' | 'closedAt'>): Promise<ChatSession> {
  if (!(await isDbAvailable())) {
    logger.warn('DB unavailable — storing session in memory.');
    const now = new Date().toISOString();
    const created: ChatSession = { ...session, id: 0, createdAt: now as any, updatedAt: now as any, closedAt: null as any };
    memSessions.set(session.sessionId, created);
    return created;
  }
  const pool = await getPool();
  await pool.request()
    .input('sessionId',          sql.NVarChar(100), session.sessionId)
    .input('contactId',          sql.NVarChar(50),  session.contactId)
    .input('phone',              sql.NVarChar(30),  session.phone)
    .input('firstName',          sql.NVarChar(100), session.firstName)
    .input('lastName',           sql.NVarChar(100), session.lastName)
    .input('email',              sql.NVarChar(150), session.email)
    .input('serviceType',        sql.NVarChar(100), session.serviceType)
    .input('trackingNumber',     sql.NVarChar(100), session.trackingNumber)
    .input('language',           sql.NVarChar(10),  session.language)
    .input('status',             sql.NVarChar(50),  session.status)
    .input('assignedDepartment', sql.NVarChar(100), session.assignedDepartment)
    .query(`
      INSERT INTO chat_sessions
        (session_id, contact_id, phone, first_name, last_name, email, service_type,
         tracking_number, language, status, assigned_department)
      VALUES
        (@sessionId, @contactId, @phone, @firstName, @lastName, @email, @serviceType,
         @trackingNumber, @language, @status, @assignedDepartment)
    `);

  const created = await findSessionById(session.sessionId);
  return created!;
}

export async function closeSession(sessionId: string): Promise<void> {
  if (!(await isDbAvailable())) {
    const s = memSessions.get(sessionId);
    if (s) { s.status = 'closed'; s.closedAt = new Date().toISOString() as any; }
    return;
  }
  const pool = await getPool();
  await pool.request()
    .input('sessionId', sql.NVarChar(100), sessionId)
    .query(`
      UPDATE chat_sessions
      SET status = 'closed', closed_at = SYSDATETIME(), updated_at = SYSDATETIME()
      WHERE session_id = @sessionId
    `);
}

// ── Messages ─────────────────────────────────────────────────────────────────

export async function saveMessage(msg: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<void> {
  if (!(await isDbAvailable())) {
    const dto: MessageDTO = {
      messageId:     msg.messageId,
      senderType:    msg.senderType,
      messageType:   msg.messageType,
      messageText:   msg.messageText ?? '',
      attachmentUrl: msg.attachmentUrl ?? null,
      createdAt:     new Date().toISOString(),
    };
    const list = memMessages.get(msg.sessionId) ?? [];
    list.push(dto);
    memMessages.set(msg.sessionId, list);
    return;
  }
  const pool = await getPool();
  await pool.request()
    .input('sessionId',        sql.NVarChar(100),  msg.sessionId)
    .input('contactId',        sql.NVarChar(50),   msg.contactId)
    .input('messageId',        sql.NVarChar(100),  msg.messageId)
    .input('respondMessageId', sql.NVarChar(100),  msg.respondMessageId)
    .input('senderType',       sql.NVarChar(30),   msg.senderType)
    .input('messageType',      sql.NVarChar(30),   msg.messageType)
    .input('messageText',      sql.NVarChar(sql.MAX), msg.messageText)
    .input('attachmentUrl',    sql.NVarChar(1000), msg.attachmentUrl)
    .input('status',           sql.NVarChar(30),   msg.status)
    .input('rawPayload',       sql.NVarChar(sql.MAX), msg.rawPayload)
    .query(`
      INSERT INTO chat_messages
        (session_id, contact_id, message_id, respond_message_id, sender_type,
         message_type, message_text, attachment_url, status, raw_payload)
      VALUES
        (@sessionId, @contactId, @messageId, @respondMessageId, @senderType,
         @messageType, @messageText, @attachmentUrl, @status, @rawPayload)
    `);
}

export async function getMessagesBySession(sessionId: string): Promise<MessageDTO[]> {
  if (!(await isDbAvailable())) {
    return memMessages.get(sessionId) ?? [];
  }
  const pool = await getPool();
  const result = await pool.request()
    .input('sessionId', sql.NVarChar(100), sessionId)
    .query<MessageDTO>(`
      SELECT
        message_id  AS messageId,
        sender_type AS senderType,
        message_type AS messageType,
        message_text AS messageText,
        attachment_url AS attachmentUrl,
        CONVERT(NVARCHAR(30), created_at, 126) AS createdAt
      FROM chat_messages
      WHERE session_id = @sessionId
      ORDER BY created_at ASC
    `);
  return result.recordset;
}

// ── Events ────────────────────────────────────────────────────────────────────

export async function saveEvent(event: Omit<ChatEvent, 'id' | 'createdAt'>): Promise<void> {
  if (!(await isDbAvailable())) {
    return; // silently drop events when DB is offline
  }
  const pool = await getPool();
  await pool.request()
    .input('sessionId',  sql.NVarChar(100),     event.sessionId)
    .input('contactId',  sql.NVarChar(50),      event.contactId)
    .input('eventType',  sql.NVarChar(100),     event.eventType)
    .input('rawPayload', sql.NVarChar(sql.MAX), event.rawPayload)
    .query(`
      INSERT INTO chat_events (session_id, contact_id, event_type, raw_payload)
      VALUES (@sessionId, @contactId, @eventType, @rawPayload)
    `);
}

// ── Contact Logs ──────────────────────────────────────────────────────────────

export async function createContactMessageLog(
  log: Omit<ContactMessageLog, 'id' | 'createdAt' | 'updatedAt' | 'emailDeliveryStatus' | 'emailError'>
): Promise<number | null> {
  if (!(await isDbAvailable())) {
    logger.warn('Could not save contact message log: database is unavailable.');
    return null;
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('topic', sql.NVarChar(100), log.topic)
      .input('name', sql.NVarChar(200), log.name)
      .input('mobile', sql.NVarChar(50), log.mobile)
      .input('email', sql.NVarChar(200), log.email)
      .input('message', sql.NVarChar(sql.MAX), log.message)
      .input('trackingNumber', sql.NVarChar(100), log.trackingNumber)
      .input('passportNumber', sql.NVarChar(100), log.passportNumber)
      .input('language', sql.NVarChar(10), log.language)
      .input('aiAnswer', sql.NVarChar(sql.MAX), log.aiAnswer)
      .input('aiRelatedTopics', sql.NVarChar(sql.MAX), log.aiRelatedTopics)
      .query<{ id: number | string }>(`
        INSERT INTO contact_message_logs
          (topic, name, mobile, email, message, tracking_number, passport_number, language, ai_answer, ai_related_topics)
        OUTPUT INSERTED.id
        VALUES
          (@topic, @name, @mobile, @email, @message, @trackingNumber, @passportNumber, @language, @aiAnswer, @aiRelatedTopics)
      `);

    // The mssql driver returns BIGINT columns as strings (to avoid precision loss),
    // even though the type here is declared as number — coerce it back explicitly.
    const rawId = result.recordset[0]?.id;
    return rawId != null ? Number(rawId) : null;
  } catch (error) {
    logger.warn(`Could not save contact message log: ${String(error)}`);
    return null;
  }
}

export async function updateContactMessageLogStatus(
  id: number,
  status: 'pending' | 'sent' | 'failed',
  emailError: string | null
): Promise<void> {
  if (!(await isDbAvailable())) {
    logger.warn(`Could not update contact message log status for ${id}: database is unavailable.`);
    return;
  }

  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .input('status', sql.NVarChar(20), status)
      .input('emailError', sql.NVarChar(sql.MAX), emailError)
      .query(`
        UPDATE contact_message_logs
        SET email_delivery_status = @status,
            email_error = @emailError,
            updated_at = SYSDATETIME()
        WHERE id = @id
      `);
  } catch (error) {
    logger.warn(`Could not update contact message log status for ${id}: ${String(error)}`);
  }
}

export async function updateContactMessageLog(
  id: number,
  log: Omit<ContactMessageLog, 'id' | 'createdAt' | 'updatedAt' | 'emailDeliveryStatus' | 'emailError'>
): Promise<boolean> {
  if (!(await isDbAvailable())) {
    logger.warn(`Could not update contact message log ${id}: database is unavailable.`);
    return false;
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('topic', sql.NVarChar(100), log.topic)
      .input('name', sql.NVarChar(200), log.name)
      .input('mobile', sql.NVarChar(50), log.mobile)
      .input('email', sql.NVarChar(200), log.email)
      .input('message', sql.NVarChar(sql.MAX), log.message)
      .input('trackingNumber', sql.NVarChar(100), log.trackingNumber)
      .input('passportNumber', sql.NVarChar(100), log.passportNumber)
      .input('language', sql.NVarChar(10), log.language)
      .input('aiAnswer', sql.NVarChar(sql.MAX), log.aiAnswer)
      .input('aiRelatedTopics', sql.NVarChar(sql.MAX), log.aiRelatedTopics)
      .query(`
        UPDATE contact_message_logs
        SET topic = @topic,
            name = @name,
            mobile = @mobile,
            email = @email,
            message = @message,
            tracking_number = @trackingNumber,
            passport_number = @passportNumber,
            language = @language,
            ai_answer = @aiAnswer,
            ai_related_topics = @aiRelatedTopics,
            updated_at = SYSDATETIME()
        WHERE id = @id
      `);

    return (result.rowsAffected?.[0] ?? 0) > 0;
  } catch (error) {
    logger.warn(`Could not update contact message log ${id}: ${String(error)}`);
    return false;
  }
}

// ── Shipping Request Logs ───────────────────────────────────────────────────────

export async function createShippingRequestLog(
  log: Omit<ShippingRequestLog, 'id' | 'createdAt' | 'updatedAt' | 'emailDeliveryStatus' | 'emailError'>
): Promise<number | null> {
  if (!(await isDbAvailable())) {
    logger.warn('Could not save shipping request log: database is unavailable.');
    return null;
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('requestType', sql.NVarChar(20), log.requestType)
      .input('customerName', sql.NVarChar(200), log.customerName)
      .input('customerPhone', sql.NVarChar(50), log.customerPhone)
      .input('customerEmail', sql.NVarChar(200), log.customerEmail)
      .input('isDocument', sql.Bit, log.isDocument)
      .input('weight', sql.Decimal(10, 2), log.weight)
      .input('pkgLength', sql.Int, log.pkgLength)
      .input('pkgWidth', sql.Int, log.pkgWidth)
      .input('pkgHeight', sql.Int, log.pkgHeight)
      .input('originCountry', sql.NVarChar(100), log.originCountry)
      .input('originCity', sql.NVarChar(100), log.originCity)
      .input('originZip', sql.NVarChar(50), log.originZip)
      .input('destCountry', sql.NVarChar(100), log.destCountry)
      .input('destCity', sql.NVarChar(100), log.destCity)
      .input('destZip', sql.NVarChar(50), log.destZip)
      .input('provider', sql.NVarChar(100), log.provider)
      .input('service', sql.NVarChar(100), log.service)
      .input('price', sql.Decimal(10, 2), log.price)
      .input('currency', sql.NVarChar(10), log.currency)
      .input('deliveryEstimate', sql.NVarChar(200), log.deliveryEstimate)
      .input('shipmentContents', sql.NVarChar(sql.MAX), log.shipmentContents)
      .input('addressDetails', sql.NVarChar(sql.MAX), log.addressDetails)
      .input('notes', sql.NVarChar(sql.MAX), log.notes)
      .input('language', sql.NVarChar(10), log.language)
      .query<{ id: number }>(`
        INSERT INTO shipping_request_logs
          (request_type, customer_name, customer_phone, customer_email, is_document, weight,
           pkg_length, pkg_width, pkg_height, origin_country, origin_city, origin_zip,
           dest_country, dest_city, dest_zip, provider, service, price, currency, delivery_estimate,
           shipment_contents, address_details, notes, language)
        OUTPUT INSERTED.id
        VALUES
          (@requestType, @customerName, @customerPhone, @customerEmail, @isDocument, @weight,
           @pkgLength, @pkgWidth, @pkgHeight, @originCountry, @originCity, @originZip,
           @destCountry, @destCity, @destZip, @provider, @service, @price, @currency, @deliveryEstimate,
           @shipmentContents, @addressDetails, @notes, @language)
      `);

    return result.recordset[0]?.id ?? null;
  } catch (error) {
    logger.warn(`Could not save shipping request log: ${String(error)}`);
    return null;
  }
}

export async function updateShippingRequestLogStatus(
  id: number,
  status: 'pending' | 'sent' | 'failed',
  emailError: string | null
): Promise<void> {
  if (!(await isDbAvailable())) {
    logger.warn(`Could not update shipping request log status for ${id}: database is unavailable.`);
    return;
  }

  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .input('status', sql.NVarChar(20), status)
      .input('emailError', sql.NVarChar(sql.MAX), emailError)
      .query(`
        UPDATE shipping_request_logs
        SET email_delivery_status = @status,
            email_error = @emailError,
            updated_at = SYSDATETIME()
        WHERE id = @id
      `);
  } catch (error) {
    logger.warn(`Could not update shipping request log status for ${id}: ${String(error)}`);
  }
}

// ── Waiting-to-Arrive Shipments ─────────────────────────────────────────────────
// Tracking numbers a customer entered that weren't found on any carrier yet. The
// twice-daily re-check job (configured separately, not yet wired up) will scan
// pending rows here and notify the customer once the shipment appears.

/** Returns the new row's id, `'duplicate'` if this tracking number is already registered, or
 *  `null` on any other failure (e.g. database unavailable). */
export async function createWaitingShipment(
  entry: Omit<WaitingShipmentEntry, 'id' | 'createdAt' | 'status' | 'lastCheckedAt' | 'foundAt'>
): Promise<number | 'duplicate' | null> {
  if (!(await isDbAvailable())) {
    logger.warn('Could not save waiting shipment: database is unavailable.');
    return null;
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('trackingNumber', sql.NVarChar(100), entry.trackingNumber)
      .input('customerName', sql.NVarChar(200), entry.customerName)
      .input('customerEmail', sql.NVarChar(200), entry.customerEmail)
      .input('customerPhone', sql.NVarChar(50), entry.customerPhone)
      .input('carrier', sql.NVarChar(20), entry.carrier)
      .input('language', sql.NVarChar(10), entry.language)
      .query<{ id: number }>(`
        INSERT INTO WaitingToArriveShipments
          (tracking_number, customer_name, customer_email, customer_phone, carrier, language)
        OUTPUT INSERTED.id
        VALUES (@trackingNumber, @customerName, @customerEmail, @customerPhone, @carrier, @language)
      `);

    return result.recordset[0]?.id ?? null;
  } catch (error) {
    // SQL Server: 2601 = duplicate key on unique index, 2627 = unique/PK constraint violation
    const errNumber = (error as { number?: number })?.number;
    if (errNumber === 2601 || errNumber === 2627) {
      return 'duplicate';
    }
    logger.warn(`Could not save waiting shipment: ${String(error)}`);
    return null;
  }
}

export async function isWaitingShipmentRegistered(trackingNumber: string): Promise<boolean> {
  if (!(await isDbAvailable())) return false;

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('trackingNumber', sql.NVarChar(100), trackingNumber)
      .query<{ id: number }>(`
        SELECT TOP 1 id FROM WaitingToArriveShipments WHERE tracking_number = @trackingNumber
      `);
    return result.recordset.length > 0;
  } catch (error) {
    logger.warn(`Could not check waiting shipment registration: ${String(error)}`);
    return false;
  }
}

export async function fetchWaitingShipments(): Promise<WaitingShipmentEntry[]> {
  if (!(await isDbAvailable())) {
    logger.warn('Could not list waiting shipments: database is unavailable.');
    return [];
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .query<{
        id: number;
        trackingNumber: string;
        customerName: string;
        customerEmail: string;
        customerPhone: string | null;
        carrier: string | null;
        language: string | null;
        status: 'pending' | 'found' | 'notified' | 'expired';
        lastCheckedAt: Date | null;
        foundAt: Date | null;
        createdAt: Date;
      }>(`
        SELECT
          id, tracking_number AS trackingNumber, customer_name AS customerName,
          customer_email AS customerEmail, customer_phone AS customerPhone,
          carrier, language, status,
          last_checked_at AS lastCheckedAt, found_at AS foundAt, created_at AS createdAt
        FROM WaitingToArriveShipments
        ORDER BY created_at DESC
      `);

    return result.recordset;
  } catch (error) {
    logger.warn(`Could not list waiting shipments: ${String(error)}`);
    return [];
  }
}

export async function updateWaitingShipmentStatus(
  id: number,
  status: 'pending' | 'found' | 'notified' | 'expired'
): Promise<boolean> {
  if (!(await isDbAvailable())) {
    logger.warn(`Could not update waiting shipment ${id}: database is unavailable.`);
    return false;
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('status', sql.NVarChar(20), status)
      .query(`
        UPDATE WaitingToArriveShipments
        SET status = @status,
            found_at = CASE WHEN @status = 'found' THEN SYSDATETIME() ELSE found_at END
        WHERE id = @id
      `);

    return (result.rowsAffected?.[0] ?? 0) > 0;
  } catch (error) {
    logger.warn(`Could not update waiting shipment ${id}: ${String(error)}`);
    return false;
  }
}

// ── Business Account Requests ───────────────────────────────────────────────────
// Corporate leads from the public "Open Account" wizard. Followed up from
// /admin/business-accounts.

export async function createBusinessAccountRequest(
  req: Omit<
    BusinessAccountRequest,
    'id' | 'status' | 'emailDeliveryStatus' | 'emailError' | 'createdAt' | 'updatedAt'
  >
): Promise<number | null> {
  if (!(await isDbAvailable())) {
    logger.warn('Could not save business account request: database is unavailable.');
    return null;
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('services', sql.NVarChar(sql.MAX), JSON.stringify(req.services ?? []))
      .input('companyName', sql.NVarChar(200), req.companyName)
      .input('companyRegNo', sql.NVarChar(100), req.companyRegNo)
      .input('industry', sql.NVarChar(100), req.industry)
      .input('website', sql.NVarChar(200), req.website)
      .input('monthlyVolumeBand', sql.NVarChar(50), req.monthlyVolumeBand)
      .input('contactName', sql.NVarChar(200), req.contactName)
      .input('contactRole', sql.NVarChar(100), req.contactRole)
      .input('contactEmail', sql.NVarChar(200), req.contactEmail)
      .input('contactPhone', sql.NVarChar(50), req.contactPhone)
      .input('pickupCity', sql.NVarChar(100), req.pickupCity)
      .input('pickupArea', sql.NVarChar(200), req.pickupArea)
      .input('destinations', sql.NVarChar(sql.MAX), req.destinations)
      .input('notes', sql.NVarChar(sql.MAX), req.notes)
      .input('language', sql.NVarChar(10), req.language)
      .query<{ id: number | string }>(`
        INSERT INTO business_account_requests
          (services, company_name, company_reg_no, industry, website, monthly_volume_band,
           contact_name, contact_role, contact_email, contact_phone,
           pickup_city, pickup_area, destinations, notes, language)
        OUTPUT INSERTED.id
        VALUES
          (@services, @companyName, @companyRegNo, @industry, @website, @monthlyVolumeBand,
           @contactName, @contactRole, @contactEmail, @contactPhone,
           @pickupCity, @pickupArea, @destinations, @notes, @language)
      `);

    const rawId = result.recordset[0]?.id;
    return rawId != null ? Number(rawId) : null;
  } catch (error) {
    logger.warn(`Could not save business account request: ${String(error)}`);
    return null;
  }
}

export async function updateBusinessAccountEmailStatus(
  id: number,
  status: 'pending' | 'sent' | 'failed',
  emailError: string | null
): Promise<void> {
  if (!(await isDbAvailable())) return;

  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.BigInt, id)
      .input('status', sql.NVarChar(20), status)
      .input('emailError', sql.NVarChar(sql.MAX), emailError)
      .query(`
        UPDATE business_account_requests
        SET email_delivery_status = @status, email_error = @emailError, updated_at = SYSDATETIME()
        WHERE id = @id
      `);
  } catch (error) {
    logger.warn(`Could not update business account request email status for ${id}: ${String(error)}`);
  }
}

export async function fetchBusinessAccountRequests(): Promise<BusinessAccountRequest[]> {
  if (!(await isDbAvailable())) {
    logger.warn('Could not list business account requests: database is unavailable.');
    return [];
  }

  try {
    const pool = await getPool();
    const result = await pool.request().query<Record<string, unknown>>(`
      SELECT
        id, services, company_name AS companyName, company_reg_no AS companyRegNo,
        industry, website, monthly_volume_band AS monthlyVolumeBand,
        contact_name AS contactName, contact_role AS contactRole,
        contact_email AS contactEmail, contact_phone AS contactPhone,
        pickup_city AS pickupCity, pickup_area AS pickupArea, destinations, notes, language,
        status, email_delivery_status AS emailDeliveryStatus, email_error AS emailError,
        created_at AS createdAt, updated_at AS updatedAt
      FROM business_account_requests
      ORDER BY created_at DESC
    `);

    return result.recordset.map((row) => {
      let services: string[] = [];
      try {
        const parsed = JSON.parse(String(row.services ?? '[]'));
        if (Array.isArray(parsed)) services = parsed.map(String);
      } catch {
        services = [];
      }
      return { ...(row as unknown as BusinessAccountRequest), services };
    });
  } catch (error) {
    logger.warn(`Could not list business account requests: ${String(error)}`);
    return [];
  }
}

export async function updateBusinessAccountRequestStatus(
  id: number,
  status: BusinessAccountStatus
): Promise<boolean> {
  if (!(await isDbAvailable())) return false;

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.BigInt, id)
      .input('status', sql.NVarChar(20), status)
      .query(`
        UPDATE business_account_requests
        SET status = @status, updated_at = SYSDATETIME()
        WHERE id = @id
      `);

    return (result.rowsAffected?.[0] ?? 0) > 0;
  } catch (error) {
    logger.warn(`Could not update business account request ${id}: ${String(error)}`);
    return false;
  }
}

// ── Novica applications (Wassel x Novica artisan program, /novica) ────────────

export async function createNovicaApplication(
  req: Omit<NovicaApplication, 'id' | 'status' | 'emailDeliveryStatus' | 'emailError' | 'createdAt' | 'updatedAt'>
): Promise<number | null> {
  if (!(await isDbAvailable())) {
    logger.warn('Could not save Novica application: database is unavailable.');
    return null;
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('fullName', sql.NVarChar(200), req.fullName)
      .input('projectName', sql.NVarChar(200), req.projectName)
      .input('city', sql.NVarChar(100), req.city)
      .input('mobile', sql.NVarChar(50), req.mobile)
      .input('email', sql.NVarChar(200), req.email)
      .input('craftType', sql.NVarChar(300), req.craftType)
      .input('craftTypeOther', sql.NVarChar(200), req.craftTypeOther)
      .input('hasSamples', sql.NVarChar(3), req.hasSamples)
      .input('sellsOnline', sql.NVarChar(3), req.sellsOnline)
      .input('sellsOnlineWhere', sql.NVarChar(300), req.sellsOnlineWhere)
      .input('website', sql.NVarChar(500), req.website)
      .input('notes', sql.NVarChar(sql.MAX), req.notes)
      .input('language', sql.NVarChar(10), req.language)
      .query<{ id: number | string }>(`
        INSERT INTO novica_applications
          (full_name, project_name, city, mobile, email, craft_type, craft_type_other,
           has_samples, sells_online, sells_online_where, website, notes, language)
        OUTPUT INSERTED.id
        VALUES
          (@fullName, @projectName, @city, @mobile, @email, @craftType, @craftTypeOther,
           @hasSamples, @sellsOnline, @sellsOnlineWhere, @website, @notes, @language)
      `);

    const rawId = result.recordset[0]?.id;
    return rawId != null ? Number(rawId) : null;
  } catch (error) {
    logger.warn(`Could not save Novica application: ${String(error)}`);
    return null;
  }
}

export async function updateNovicaApplicationEmailStatus(
  id: number,
  status: 'pending' | 'sent' | 'failed',
  emailError: string | null
): Promise<void> {
  if (!(await isDbAvailable())) return;

  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.BigInt, id)
      .input('status', sql.NVarChar(20), status)
      .input('emailError', sql.NVarChar(sql.MAX), emailError)
      .query(`
        UPDATE novica_applications
        SET email_delivery_status = @status, email_error = @emailError, updated_at = SYSDATETIME()
        WHERE id = @id
      `);
  } catch (error) {
    logger.warn(`Could not update Novica application email status for ${id}: ${String(error)}`);
  }
}

export async function fetchNovicaApplications(): Promise<NovicaApplication[]> {
  if (!(await isDbAvailable())) {
    logger.warn('Could not list Novica applications: database is unavailable.');
    return [];
  }

  try {
    const pool = await getPool();
    const result = await pool.request().query<Record<string, unknown>>(`
      SELECT
        id, full_name AS fullName, project_name AS projectName, city, mobile, email,
        craft_type AS craftType, craft_type_other AS craftTypeOther,
        has_samples AS hasSamples, sells_online AS sellsOnline, sells_online_where AS sellsOnlineWhere,
        website, notes, language, status, email_delivery_status AS emailDeliveryStatus, email_error AS emailError,
        created_at AS createdAt, updated_at AS updatedAt
      FROM novica_applications
      ORDER BY created_at DESC
    `);

    return result.recordset as unknown as NovicaApplication[];
  } catch (error) {
    logger.warn(`Could not list Novica applications: ${String(error)}`);
    return [];
  }
}

export async function updateNovicaApplicationStatus(
  id: number,
  status: NovicaApplicationStatus
): Promise<boolean> {
  if (!(await isDbAvailable())) return false;

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.BigInt, id)
      .input('status', sql.NVarChar(20), status)
      .query(`
        UPDATE novica_applications
        SET status = @status, updated_at = SYSDATETIME()
        WHERE id = @id
      `);

    return (result.rowsAffected?.[0] ?? 0) > 0;
  } catch (error) {
    logger.warn(`Could not update Novica application ${id}: ${String(error)}`);
    return false;
  }
}
