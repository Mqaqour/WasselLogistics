import { getPool, sql } from '../config/database';
import { ChatSession, ChatMessage, ChatEvent, MessageDTO } from '../types/chat.types';
import { logger } from '../utils/logger';

// ── In-memory fallback (used when SQL Server is unreachable) ──────────────────
const memSessions  = new Map<string, ChatSession>();
const memMessages  = new Map<string, MessageDTO[]>();

let _dbAvailable: boolean | null = null;

/** Called once at startup so request-time checks are instant. */
export function setDbAvailable(available: boolean): void {
  _dbAvailable = available;
}

async function isDbAvailable(): Promise<boolean> {
  if (_dbAvailable !== null) return _dbAvailable;
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
      messageId:   msg.messageId,
      senderType:  msg.senderType,
      messageType: msg.messageType,
      messageText: msg.messageText ?? '',
      createdAt:   new Date().toISOString(),
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
