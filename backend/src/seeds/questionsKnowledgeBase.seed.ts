// ─────────────────────────────────────────────────────────────────────────────
// SeedQuestionsKnowledgeBaseAsync
//
// Idempotent seed for the Questions Knowledge Base.
// Safe to call on every server start:
//   - Topics are skipped if their code already exists.
//   - Questions are skipped if their intentKey already exists.
//   - Tags are skipped if the same (languageCode + name) pair already exists.
//   - Keywords are skipped if the same (questionId + languageCode + keyword) already exists.
//
// Source of truth: knowledge base documents provided by Wassel.
// ─────────────────────────────────────────────────────────────────────────────
import { getPool, sql } from '../config/database';
import { logger } from '../utils/logger';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getOrCreateTopic(
  pool: Awaited<ReturnType<typeof getPool>>,
  code: string,
  isActive: boolean,
): Promise<number> {
  const existing = await pool.request()
    .input('code', sql.NVarChar(100), code)
    .query<{ id: number }>(`SELECT id FROM kb_topics WHERE code = @code`);

  if (existing.recordset.length > 0) return existing.recordset[0].id;

  const result = await pool.request()
    .input('code',     sql.NVarChar(100), code)
    .input('isActive', sql.Bit,           isActive)
    .query<{ id: number }>(`
      INSERT INTO kb_topics (code, is_active)
      OUTPUT INSERTED.id
      VALUES (@code, @isActive)
    `);
  return result.recordset[0].id;
}

async function upsertTopicTranslation(
  pool: Awaited<ReturnType<typeof getPool>>,
  topicId: number,
  lang: string,
  name: string,
  description: string | null,
): Promise<void> {
  const existing = await pool.request()
    .input('topicId', sql.Int,         topicId)
    .input('lang',    sql.NVarChar(5), lang)
    .query(`SELECT id FROM kb_topic_translations WHERE topic_id = @topicId AND language_code = @lang`);

  if (existing.recordset.length > 0) return; // already seeded

  await pool.request()
    .input('topicId', sql.Int,           topicId)
    .input('lang',    sql.NVarChar(5),   lang)
    .input('name',    sql.NVarChar(500), name)
    .input('desc',    sql.NVarChar(2000), description)
    .query(`
      INSERT INTO kb_topic_translations (topic_id, language_code, name, description)
      VALUES (@topicId, @lang, @name, @desc)
    `);
}

async function getOrCreateQuestion(
  pool: Awaited<ReturnType<typeof getPool>>,
  topicId: number,
  intentKey: string,
  priority: number,
): Promise<number> {
  const existing = await pool.request()
    .input('intentKey', sql.NVarChar(200), intentKey)
    .query<{ id: number }>(`SELECT id FROM kb_questions WHERE intent_key = @intentKey`);

  if (existing.recordset.length > 0) return existing.recordset[0].id;

  const result = await pool.request()
    .input('topicId',   sql.Int,          topicId)
    .input('intentKey', sql.NVarChar(200), intentKey)
    .input('priority',  sql.Int,          priority)
    .query<{ id: number }>(`
      INSERT INTO kb_questions (topic_id, intent_key, priority, is_active)
      OUTPUT INSERTED.id
      VALUES (@topicId, @intentKey, @priority, 1)
    `);
  return result.recordset[0].id;
}

async function upsertQuestionTranslation(
  pool: Awaited<ReturnType<typeof getPool>>,
  questionId: number,
  lang: string,
  questionText: string,
): Promise<void> {
  const existing = await pool.request()
    .input('qid',  sql.Int,         questionId)
    .input('lang', sql.NVarChar(5), lang)
    .query(`SELECT id FROM kb_question_translations WHERE question_id = @qid AND language_code = @lang`);

  if (existing.recordset.length > 0) return;

  await pool.request()
    .input('qid',          sql.Int,           questionId)
    .input('lang',         sql.NVarChar(5),   lang)
    .input('questionText', sql.NVarChar(2000), questionText)
    .query(`
      INSERT INTO kb_question_translations (question_id, language_code, question_text)
      VALUES (@qid, @lang, @questionText)
    `);
}

async function upsertAnswerTranslation(
  pool: Awaited<ReturnType<typeof getPool>>,
  questionId: number,
  lang: string,
  answerText: string,
): Promise<void> {
  const existing = await pool.request()
    .input('qid',  sql.Int,         questionId)
    .input('lang', sql.NVarChar(5), lang)
    .query(`SELECT id FROM kb_answer_translations WHERE question_id = @qid AND language_code = @lang`);

  if (existing.recordset.length > 0) return;

  await pool.request()
    .input('qid',        sql.Int,               questionId)
    .input('lang',       sql.NVarChar(5),        lang)
    .input('answerText', sql.NVarChar(sql.MAX),  answerText)
    .query(`
      INSERT INTO kb_answer_translations (question_id, language_code, answer_text)
      VALUES (@qid, @lang, @answerText)
    `);
}

async function getOrCreateTag(
  pool: Awaited<ReturnType<typeof getPool>>,
  lang: string,
  name: string,
): Promise<number> {
  const existing = await pool.request()
    .input('lang', sql.NVarChar(5),   lang)
    .input('name', sql.NVarChar(200), name)
    .query<{ id: number }>(`
      SELECT id FROM kb_tags WHERE language_code = @lang AND name = @name
    `);

  if (existing.recordset.length > 0) return existing.recordset[0].id;

  const result = await pool.request()
    .input('lang', sql.NVarChar(5),   lang)
    .input('name', sql.NVarChar(200), name)
    .query<{ id: number }>(`
      INSERT INTO kb_tags (language_code, name)
      OUTPUT INSERTED.id
      VALUES (@lang, @name)
    `);
  return result.recordset[0].id;
}

async function linkQuestionTag(
  pool: Awaited<ReturnType<typeof getPool>>,
  questionId: number,
  tagId: number,
): Promise<void> {
  const existing = await pool.request()
    .input('qid',   sql.Int, questionId)
    .input('tagId', sql.Int, tagId)
    .query(`SELECT 1 FROM kb_question_tags WHERE question_id = @qid AND tag_id = @tagId`);

  if (existing.recordset.length > 0) return;

  await pool.request()
    .input('qid',   sql.Int, questionId)
    .input('tagId', sql.Int, tagId)
    .query(`INSERT INTO kb_question_tags (question_id, tag_id) VALUES (@qid, @tagId)`);
}

async function upsertKeyword(
  pool: Awaited<ReturnType<typeof getPool>>,
  questionId: number,
  lang: string,
  keyword: string,
): Promise<void> {
  const existing = await pool.request()
    .input('qid',     sql.Int,          questionId)
    .input('lang',    sql.NVarChar(5),  lang)
    .input('keyword', sql.NVarChar(300), keyword)
    .query(`
      SELECT id FROM kb_question_keywords
      WHERE question_id = @qid AND language_code = @lang AND keyword = @keyword
    `);

  if (existing.recordset.length > 0) return;

  await pool.request()
    .input('qid',     sql.Int,           questionId)
    .input('lang',    sql.NVarChar(5),   lang)
    .input('keyword', sql.NVarChar(300), keyword)
    .query(`
      INSERT INTO kb_question_keywords (question_id, language_code, keyword)
      VALUES (@qid, @lang, @keyword)
    `);
}

// ── Main seed function ────────────────────────────────────────────────────────

export async function seedQuestionsKnowledgeBaseAsync(): Promise<void> {
  logger.info('KB seed: starting…');

  let pool: Awaited<ReturnType<typeof getPool>>;
  try {
    pool = await getPool();
  } catch {
    logger.warn('KB seed: DB not available — skipping seed.');
    return;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOPICS
  // ═══════════════════════════════════════════════════════════════════════════

  const noObjId         = await getOrCreateTopic(pool, 'NO_OBJECTION',       true);
  const passportId      = await getOrCreateTopic(pool, 'JORDANIAN_PASSPORT',  true);
  const intlShippingId  = await getOrCreateTopic(pool, 'INTERNATIONAL_SHIPPING', true);
  // LOCAL_SHIPPING: inactive placeholder — correct content not yet available
  const localShippingId = await getOrCreateTopic(pool, 'LOCAL_SHIPPING',      false);

  await upsertTopicTranslation(pool, noObjId,        'ar', 'خدمة عدم الممانعة',                 null);
  await upsertTopicTranslation(pool, noObjId,        'en', 'No Objection Service',               null);
  await upsertTopicTranslation(pool, passportId,     'ar', 'خدمة جواز السفر الأردني المؤقت',    null);
  await upsertTopicTranslation(pool, passportId,     'en', 'Jordanian Temporary Passport Service', null);
  await upsertTopicTranslation(pool, intlShippingId, 'ar', 'خدمة النقل الدولي',                 null);
  await upsertTopicTranslation(pool, intlShippingId, 'en', 'International Shipping Service',     null);
  await upsertTopicTranslation(pool, localShippingId,'ar', 'خدمة النقل المحلي',                  'محتوى قيد المراجعة — هذه الخدمة غير نشطة مؤقتاً');
  await upsertTopicTranslation(pool, localShippingId,'en', 'Local Shipping Service',              'Content under review — this topic is temporarily inactive');

  // ═══════════════════════════════════════════════════════════════════════════
  // TAGS
  // ═══════════════════════════════════════════════════════════════════════════

  const arTagNames = [
    'عدم الممانعة','رسوم','مستندات','فروع','جواز','جواز أردني','جواز مؤقت',
    'هوية خضراء','هوية زرقاء','بطاقة مراجعة','تجديد','إصدار','روابي',
    'نقل دولي','شحن دولي','استيراد','تصدير','فيديكس','دي اتش ال',
    'تخليص جمركي','عرض سعر',
  ];
  const enTagNames = [
    'no objection','fees','documents','branches','passport','Jordanian passport',
    'temporary passport','green ID','blue ID','review card','renewal','issuance',
    'Rawabi','international shipping','import','export','FedEx','DHL',
    'customs clearance','quote',
  ];

  // Build tag name → id maps
  const arTagMap = new Map<string, number>();
  const enTagMap = new Map<string, number>();

  for (const name of arTagNames) arTagMap.set(name, await getOrCreateTag(pool, 'ar', name));
  for (const name of enTagNames) enTagMap.set(name, await getOrCreateTag(pool, 'en', name));

  // ═══════════════════════════════════════════════════════════════════════════
  // QUESTIONS — NO_OBJECTION
  // ═══════════════════════════════════════════════════════════════════════════

  // ── NO_OBJECTION_FEES ──────────────────────────────────────────────────────
  {
    const qid = await getOrCreateQuestion(pool, noObjId, 'NO_OBJECTION_FEES', 10);
    await upsertQuestionTranslation(pool, qid, 'ar', 'كم رسوم خدمة عدم الممانعة؟');
    await upsertQuestionTranslation(pool, qid, 'en', 'What are the fees for the No Objection service?');
    await upsertAnswerTranslation(pool, qid, 'ar',
      'رسوم تقديم طلب خدمة عدم الممانعة هي 50 شيكل لكل طلب. الأطفال دون 16 سنة معفون من الرسوم ولا يتم استيفاء أي مبلغ عنهم.');
    await upsertAnswerTranslation(pool, qid, 'en',
      'The No Objection service fee is 50 ILS per request. Children under 16 are exempt from the fee.');
    for (const kw of ['رسوم','سعر','تكلفة','عدم ممانعة','طلب عدم ممانعة','اطفال','طفل'])
      await upsertKeyword(pool, qid, 'ar', kw);
    for (const kw of ['fees','cost','price','no objection','children','child'])
      await upsertKeyword(pool, qid, 'en', kw);
    for (const tag of ['عدم الممانعة','رسوم']) await linkQuestionTag(pool, qid, arTagMap.get(tag)!);
    for (const tag of ['no objection','fees']) await linkQuestionTag(pool, qid, enTagMap.get(tag)!);
  }

  // ── NO_OBJECTION_ELIGIBLE_CATEGORIES ──────────────────────────────────────
  {
    const qid = await getOrCreateQuestion(pool, noObjId, 'NO_OBJECTION_ELIGIBLE_CATEGORIES', 9);
    await upsertQuestionTranslation(pool, qid, 'ar', 'من هي الفئات المستفيدة من خدمة عدم الممانعة؟');
    await upsertQuestionTranslation(pool, qid, 'en', 'Who can benefit from the No Objection service?');
    await upsertAnswerTranslation(pool, qid, 'ar',
      'تُقدَّم خدمة عدم الممانعة للفئات التالية فقط: المغتربون الحاصلون على الكرت الأزرق، والأشخاص المولودون في قطاع غزة والذين تحمل هوياتهم عنوان غزة.');
    await upsertAnswerTranslation(pool, qid, 'en',
      'The service is available only for expatriates holding the blue card and people born in Gaza whose IDs show a Gaza address.');
    for (const kw of ['الفئات','مستفيد','كرت ازرق','غزة','مغتربين','هوية غزة'])
      await upsertKeyword(pool, qid, 'ar', kw);
    for (const kw of ['eligible','blue card','Gaza','expatriates','beneficiaries'])
      await upsertKeyword(pool, qid, 'en', kw);
    for (const tag of ['عدم الممانعة']) await linkQuestionTag(pool, qid, arTagMap.get(tag)!);
    for (const tag of ['no objection']) await linkQuestionTag(pool, qid, enTagMap.get(tag)!);
  }

  // ── NO_OBJECTION_GREEN_CARD ────────────────────────────────────────────────
  {
    const qid = await getOrCreateQuestion(pool, noObjId, 'NO_OBJECTION_GREEN_CARD', 8);
    await upsertQuestionTranslation(pool, qid, 'ar', 'هل حاملو الكرت الأخضر مشمولون بخدمة عدم الممانعة؟');
    await upsertQuestionTranslation(pool, qid, 'en', 'Are green card holders included in the No Objection service?');
    await upsertAnswerTranslation(pool, qid, 'ar',
      'لا، خدمة عدم الممانعة لا تشمل حاملي الكرت الأخضر. يُفضَّل لهذه الفئة مراجعة الممثليات مباشرة، وفي حال تم توجيههم رسميًا للتقديم عبر شركة واصل يمكنهم عندها الاستفادة من الخدمة.');
    await upsertAnswerTranslation(pool, qid, 'en',
      'No. Green card holders are not included. They should contact the representative offices directly. If they are officially directed to apply through Wassel, they may then use the service.');
    for (const kw of ['كرت اخضر','هوية خضراء','غير مشمول','ممثليات'])
      await upsertKeyword(pool, qid, 'ar', kw);
    for (const kw of ['green card','green id','not included','representative office'])
      await upsertKeyword(pool, qid, 'en', kw);
    for (const tag of ['عدم الممانعة','هوية خضراء']) await linkQuestionTag(pool, qid, arTagMap.get(tag)!);
    for (const tag of ['no objection','green ID']) await linkQuestionTag(pool, qid, enTagMap.get(tag)!);
  }

  // ── NO_OBJECTION_REQUIRED_DOCUMENTS ───────────────────────────────────────
  {
    const qid = await getOrCreateQuestion(pool, noObjId, 'NO_OBJECTION_REQUIRED_DOCUMENTS', 10);
    await upsertQuestionTranslation(pool, qid, 'ar', 'ما هي المستندات المطلوبة لخدمة عدم الممانعة؟');
    await upsertQuestionTranslation(pool, qid, 'en', 'What documents are required for the No Objection service?');
    await upsertAnswerTranslation(pool, qid, 'ar',
      'المستندات المطلوبة هي: صورة شخصية بخلفية بيضاء أو زرقاء، جواز سفر ساري المفعول لمدة لا تقل عن 6 أشهر، الهوية الفلسطينية للبالغين فوق 18 سنة، شهادة ميلاد للأطفال دون 18 سنة، وأي مستندات داعمة توضح سبب الطلب مثل فيزا، تقارير طبية، دعوة زفاف، قبول أو إثبات دراسة، أو وثائق رسمية أخرى ذات صلة.');
    await upsertAnswerTranslation(pool, qid, 'en',
      'Required documents are: a personal photo with a white or blue background, a passport valid for at least 6 months, Palestinian ID for adults over 18, birth certificate for children under 18, and any supporting documents explaining the reason for the request such as a visa, medical reports, wedding invitation, study acceptance/proof, or other relevant official documents.');
    for (const kw of ['مستندات','وثائق','صورة','جواز','هوية','شهادة ميلاد','فيزا','تقرير طبي','دعوة','دراسة'])
      await upsertKeyword(pool, qid, 'ar', kw);
    for (const kw of ['documents','requirements','photo','passport','ID','birth certificate','visa','medical report','invitation','study'])
      await upsertKeyword(pool, qid, 'en', kw);
    for (const tag of ['عدم الممانعة','مستندات']) await linkQuestionTag(pool, qid, arTagMap.get(tag)!);
    for (const tag of ['no objection','documents']) await linkQuestionTag(pool, qid, enTagMap.get(tag)!);
  }

  // ── NO_OBJECTION_BRANCHES ─────────────────────────────────────────────────
  {
    const qid = await getOrCreateQuestion(pool, noObjId, 'NO_OBJECTION_BRANCHES', 7);
    await upsertQuestionTranslation(pool, qid, 'ar', 'في أي فروع يمكن تقديم طلب عدم الممانعة؟');
    await upsertQuestionTranslation(pool, qid, 'en', 'Which branches accept No Objection service applications?');
    await upsertAnswerTranslation(pool, qid, 'ar',
      'يمكن تقديم طلب خدمة عدم الممانعة من خلال فروع واصل التالية: فرع الخليل، فرع رام الله، وفرع نابلس.');
    await upsertAnswerTranslation(pool, qid, 'en',
      'The No Objection service can be submitted through the following Wassel branches: Hebron, Ramallah, and Nablus.');
    for (const kw of ['فروع','فرع','رام الله','نابلس','الخليل','تقديم الطلب'])
      await upsertKeyword(pool, qid, 'ar', kw);
    for (const kw of ['branches','branch','Ramallah','Nablus','Hebron','submit'])
      await upsertKeyword(pool, qid, 'en', kw);
    for (const tag of ['عدم الممانعة','فروع']) await linkQuestionTag(pool, qid, arTagMap.get(tag)!);
    for (const tag of ['no objection','branches']) await linkQuestionTag(pool, qid, enTagMap.get(tag)!);
  }

  // ── NO_OBJECTION_RESPONSE_TIME ────────────────────────────────────────────
  {
    const qid = await getOrCreateQuestion(pool, noObjId, 'NO_OBJECTION_RESPONSE_TIME', 6);
    await upsertQuestionTranslation(pool, qid, 'ar', 'كم مدة الرد على طلب عدم الممانعة؟');
    await upsertQuestionTranslation(pool, qid, 'en', 'How long does it take to receive a response for the No Objection request?');
    await upsertAnswerTranslation(pool, qid, 'ar',
      'لا توجد مدة زمنية محددة حاليًا للرد على الطلب. دور شركة واصل يقتصر على تقديم الطلب فقط، وأي استفسارات أو متابعة بعد التقديم تتم حصريًا عبر الممثلية الأردنية في رام الله.');
    await upsertAnswerTranslation(pool, qid, 'en',
      'There is currently no fixed response time. Wassel\'s role is limited to submitting the application only. Any follow-up after submission must be done exclusively through the Jordanian representative office in Ramallah.');
    for (const kw of ['مدة','وقت','رد','متابعة','الممثلية الأردنية','رام الله'])
      await upsertKeyword(pool, qid, 'ar', kw);
    for (const kw of ['duration','response time','follow up','Jordanian representative office','Ramallah'])
      await upsertKeyword(pool, qid, 'en', kw);
    for (const tag of ['عدم الممانعة']) await linkQuestionTag(pool, qid, arTagMap.get(tag)!);
    for (const tag of ['no objection']) await linkQuestionTag(pool, qid, enTagMap.get(tag)!);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUESTIONS — JORDANIAN_PASSPORT
  // ═══════════════════════════════════════════════════════════════════════════

  // ── PASSPORT_SERVICE_OVERVIEW ──────────────────────────────────────────────
  {
    const qid = await getOrCreateQuestion(pool, passportId, 'PASSPORT_SERVICE_OVERVIEW', 9);
    await upsertQuestionTranslation(pool, qid, 'ar', 'ما هي خدمة جواز السفر الأردني المؤقت؟');
    await upsertQuestionTranslation(pool, qid, 'en', 'What is the Jordanian temporary passport service?');
    await upsertAnswerTranslation(pool, qid, 'ar',
      'تقدم شركة واصل خدمة استلام وتسليم جواز السفر الأردني المؤقت لحملة الهوية الخضراء، بالإضافة إلى حملة الهوية الزرقاء المقدسيين بشرط توفر بطاقة مراجعة. تقوم واصل باستلام بطاقة المراجعة والرسوم والجواز القديم في حال التجديد، ثم متابعة إصدار أو تجديد الجواز المؤقت وتسليمه في مركز واصل للخدمات الأردنية - كيو سنتر روابي.');
    await upsertAnswerTranslation(pool, qid, 'en',
      'Wassel provides a service for receiving and delivering Jordanian temporary passports for green ID holders, and blue ID holders from Jerusalem if they have a review card. Wassel receives the review card, fees, and old passport in renewal cases, then follows up on the issuance or renewal and delivers the passport at Wassel Jordanian Services Center - Q Center Rawabi.');
    for (const kw of ['جواز اردني','جواز مؤقت','هوية خضراء','هوية زرقاء','بطاقة مراجعة','روابي'])
      await upsertKeyword(pool, qid, 'ar', kw);
    for (const kw of ['Jordanian passport','temporary passport','green ID','blue ID','review card','Rawabi'])
      await upsertKeyword(pool, qid, 'en', kw);
    for (const tag of ['جواز أردني','جواز مؤقت','هوية خضراء','بطاقة مراجعة'])
      await linkQuestionTag(pool, qid, arTagMap.get(tag)!);
    for (const tag of ['Jordanian passport','temporary passport','green ID','review card'])
      await linkQuestionTag(pool, qid, enTagMap.get(tag)!);
  }

  // ── PASSPORT_PROCESS_STEPS ─────────────────────────────────────────────────
  {
    const qid = await getOrCreateQuestion(pool, passportId, 'PASSPORT_PROCESS_STEPS', 10);
    await upsertQuestionTranslation(pool, qid, 'ar', 'ما هي خطوات تقديم معاملة إصدار أو تجديد الجواز الأردني؟');
    await upsertQuestionTranslation(pool, qid, 'en', 'What are the steps to issue or renew a Jordanian passport?');
    await upsertAnswerTranslation(pool, qid, 'ar',
      'يجب على مقدم الطلب التوجه إلى دائرة الأحوال المدنية الأردنية في الأردن، وبعد تقديم معاملة الإصدار أو التجديد يحصل على بطاقة مراجعة. بعد استلام بطاقة المراجعة يمكنه العودة إلى فلسطين، ثم يرسل صورة بطاقة المراجعة لفريق واصل عبر الواتساب. بعد الحصول على موافقة، يحضر إلى أحد فروع واصل لتسليم بطاقة المراجعة الأصلية والرسوم والجواز القديم في حال كانت المعاملة تجديد.');
    await upsertAnswerTranslation(pool, qid, 'en',
      'The applicant must visit the Jordanian Civil Status and Passports Department in Jordan. After submitting the issuance or renewal application, they receive a review card. They can then return to Palestine and send a photo of the review card to Wassel via WhatsApp. After approval, they visit a Wassel branch to submit the original review card, fees, and old passport if it is a renewal.');
    for (const kw of ['خطوات','اصدار','تجديد','دائرة الاحوال','بطاقة مراجعة','واتساب','الجواز القديم'])
      await upsertKeyword(pool, qid, 'ar', kw);
    for (const kw of ['steps','issue','renew','civil status','review card','WhatsApp','old passport'])
      await upsertKeyword(pool, qid, 'en', kw);
    for (const tag of ['جواز','بطاقة مراجعة','إصدار','تجديد'])
      await linkQuestionTag(pool, qid, arTagMap.get(tag)!);
    for (const tag of ['passport','review card','issuance','renewal'])
      await linkQuestionTag(pool, qid, enTagMap.get(tag)!);
  }

  // ── PASSPORT_GREEN_ID_FEES ─────────────────────────────────────────────────
  {
    const qid = await getOrCreateQuestion(pool, passportId, 'PASSPORT_GREEN_ID_FEES', 10);
    await upsertQuestionTranslation(pool, qid, 'ar', 'كم رسوم تجديد أو إصدار الجواز لحملة الهوية الخضراء؟');
    await upsertQuestionTranslation(pool, qid, 'en', 'What are the passport issuance or renewal fees for green ID holders?');
    await upsertAnswerTranslation(pool, qid, 'ar',
      'رسوم حملة الهوية الخضراء هي 200 دينار أردني رسوم إصدار أو تجديد، بالإضافة إلى 70 دينار أردني رسوم نقل وتأمين. الإجمالي هو 270 دينار أردني.');
    await upsertAnswerTranslation(pool, qid, 'en',
      'For green ID holders, the fee is 200 JOD for issuance or renewal, plus 70 JOD for transport and insurance. The total is 270 JOD.');
    for (const kw of ['رسوم','تكلفة','سعر','هوية خضراء','جواز','تجديد','اصدار','270','دينار'])
      await upsertKeyword(pool, qid, 'ar', kw);
    for (const kw of ['fees','cost','price','green ID','passport','renewal','issuance','270','JOD'])
      await upsertKeyword(pool, qid, 'en', kw);
    for (const tag of ['رسوم','هوية خضراء','جواز'])
      await linkQuestionTag(pool, qid, arTagMap.get(tag)!);
    for (const tag of ['fees','green ID','passport'])
      await linkQuestionTag(pool, qid, enTagMap.get(tag)!);
  }

  // ── PASSPORT_BLUE_ID_FEES ──────────────────────────────────────────────────
  {
    const qid = await getOrCreateQuestion(pool, passportId, 'PASSPORT_BLUE_ID_FEES', 10);
    await upsertQuestionTranslation(pool, qid, 'ar', 'كم رسوم تجديد أو إصدار الجواز لحملة الهوية الزرقاء؟');
    await upsertQuestionTranslation(pool, qid, 'en', 'What are the passport issuance or renewal fees for blue ID holders?');
    await upsertAnswerTranslation(pool, qid, 'ar',
      'رسوم حملة الهوية الزرقاء المقدسيين، بشرط وجود بطاقة مراجعة، هي 50 دينار أردني رسوم إصدار أو تجديد، بالإضافة إلى 70 دينار أردني رسوم نقل وتأمين. الإجمالي هو 120 دينار أردني.');
    await upsertAnswerTranslation(pool, qid, 'en',
      'For blue ID holders from Jerusalem, with a valid review card, the fee is 50 JOD for issuance or renewal, plus 70 JOD for transport and insurance. The total is 120 JOD.');
    for (const kw of ['رسوم','هوية زرقاء','مقدسيين','بطاقة مراجعة','120','دينار','جواز'])
      await upsertKeyword(pool, qid, 'ar', kw);
    for (const kw of ['fees','blue ID','Jerusalem','review card','120','JOD','passport'])
      await upsertKeyword(pool, qid, 'en', kw);
    for (const tag of ['رسوم','هوية زرقاء','بطاقة مراجعة'])
      await linkQuestionTag(pool, qid, arTagMap.get(tag)!);
    for (const tag of ['fees','blue ID','review card'])
      await linkQuestionTag(pool, qid, enTagMap.get(tag)!);
  }

  // ── PASSPORT_REQUIRED_DOCUMENTS ───────────────────────────────────────────
  {
    const qid = await getOrCreateQuestion(pool, passportId, 'PASSPORT_REQUIRED_DOCUMENTS', 10);
    await upsertQuestionTranslation(pool, qid, 'ar', 'ما هي المستندات المطلوبة لخدمة الجواز الأردني المؤقت؟');
    await upsertQuestionTranslation(pool, qid, 'en', 'What documents are required for the Jordanian temporary passport service?');
    await upsertAnswerTranslation(pool, qid, 'ar',
      'المستندات المطلوبة هي بطاقة المراجعة الأصلية، رسوم الإصدار أو التجديد، والجواز القديم في حال كانت المعاملة تجديد فقط.');
    await upsertAnswerTranslation(pool, qid, 'en',
      'The required documents are the original review card, issuance or renewal fees, and the old passport if the transaction is a renewal.');
    for (const kw of ['مستندات','وثائق','بطاقة مراجعة','رسوم','الجواز القديم','تجديد'])
      await upsertKeyword(pool, qid, 'ar', kw);
    for (const kw of ['documents','requirements','review card','fees','old passport','renewal'])
      await upsertKeyword(pool, qid, 'en', kw);
    for (const tag of ['مستندات','بطاقة مراجعة','جواز'])
      await linkQuestionTag(pool, qid, arTagMap.get(tag)!);
    for (const tag of ['documents','review card','passport'])
      await linkQuestionTag(pool, qid, enTagMap.get(tag)!);
  }

  // ── PASSPORT_NOT_AVAILABLE ─────────────────────────────────────────────────
  {
    const qid = await getOrCreateQuestion(pool, passportId, 'PASSPORT_NOT_AVAILABLE', 8);
    await upsertQuestionTranslation(pool, qid, 'ar', 'ما هي معاملات الجواز غير المتاحة عبر واصل؟');
    await upsertQuestionTranslation(pool, qid, 'en', 'Which passport transactions are not available through Wassel?');
    await upsertAnswerTranslation(pool, qid, 'ar',
      'شركة واصل لا تعالج معاملات بدل فاقد، أو أي معاملة بدون بطاقة مراجعة، أو بطاقات مراجعة غير مطابقة للشروط، أو معاملات إضافة أبناء لحملة الهوية الخضراء.');
    await upsertAnswerTranslation(pool, qid, 'en',
      'Wassel does not handle lost passport replacement transactions, any transaction without a review card, review cards that do not meet the conditions, or adding children for green ID holders.');
    for (const kw of ['غير متاح','بدل فاقد','بدون بطاقة مراجعة','اضافة ابناء','شروط'])
      await upsertKeyword(pool, qid, 'ar', kw);
    for (const kw of ['not available','lost passport','no review card','add children','conditions'])
      await upsertKeyword(pool, qid, 'en', kw);
    for (const tag of ['جواز']) await linkQuestionTag(pool, qid, arTagMap.get(tag)!);
    for (const tag of ['passport']) await linkQuestionTag(pool, qid, enTagMap.get(tag)!);
  }

  // ── PASSPORT_DURATION ──────────────────────────────────────────────────────
  {
    const qid = await getOrCreateQuestion(pool, passportId, 'PASSPORT_DURATION', 9);
    await upsertQuestionTranslation(pool, qid, 'ar', 'كم تستغرق معاملة إصدار أو تجديد الجواز؟');
    await upsertQuestionTranslation(pool, qid, 'en', 'How long does the passport issuance or renewal process take?');
    await upsertAnswerTranslation(pool, qid, 'ar',
      'تستغرق معاملة إصدار أو تجديد الجواز من 7 إلى 10 أيام عمل من تاريخ تقديم بطاقة المراجعة في مكاتب واصل.');
    await upsertAnswerTranslation(pool, qid, 'en',
      'The issuance or renewal process takes 7 to 10 business days from the date the review card is submitted at Wassel offices.');
    for (const kw of ['مدة','وقت','تستغرق','7','10','ايام عمل','تجديد','اصدار'])
      await upsertKeyword(pool, qid, 'ar', kw);
    for (const kw of ['duration','time','7','10','business days','renewal','issuance'])
      await upsertKeyword(pool, qid, 'en', kw);
    for (const tag of ['جواز','تجديد','إصدار'])
      await linkQuestionTag(pool, qid, arTagMap.get(tag)!);
    for (const tag of ['passport','renewal','issuance'])
      await linkQuestionTag(pool, qid, enTagMap.get(tag)!);
  }

  // ── PASSPORT_PICKUP_LOCATION ───────────────────────────────────────────────
  {
    const qid = await getOrCreateQuestion(pool, passportId, 'PASSPORT_PICKUP_LOCATION', 8);
    await upsertQuestionTranslation(pool, qid, 'ar', 'أين يتم استلام الجواز بعد صدوره؟');
    await upsertQuestionTranslation(pool, qid, 'en', 'Where can the passport be collected after it is ready?');
    await upsertAnswerTranslation(pool, qid, 'ar',
      'يتم استلام الجواز حصريًا من مركز واصل للخدمات الأردنية - كيو سنتر روابي، بعد وصول رسالة نصية لصاحب العلاقة لإعلامه بوصول جواز السفر.');
    await upsertAnswerTranslation(pool, qid, 'en',
      'The passport is collected only from Wassel Jordanian Services Center - Q Center Rawabi, after the applicant receives an SMS confirming the passport has arrived.');
    for (const kw of ['استلام','تسليم','روابي','كيو سنتر','رسالة نصية','وصل الجواز'])
      await upsertKeyword(pool, qid, 'ar', kw);
    for (const kw of ['pickup','delivery','Rawabi','Q Center','SMS','passport arrived'])
      await upsertKeyword(pool, qid, 'en', kw);
    for (const tag of ['روابي','جواز']) await linkQuestionTag(pool, qid, arTagMap.get(tag)!);
    for (const tag of ['Rawabi','passport']) await linkQuestionTag(pool, qid, enTagMap.get(tag)!);
  }

  // ── PASSPORT_WHO_CAN_PICKUP ────────────────────────────────────────────────
  {
    const qid = await getOrCreateQuestion(pool, passportId, 'PASSPORT_WHO_CAN_PICKUP', 7);
    await upsertQuestionTranslation(pool, qid, 'ar', 'من يستطيع استلام الجواز؟');
    await upsertQuestionTranslation(pool, qid, 'en', 'Who can collect the passport?');
    await upsertAnswerTranslation(pool, qid, 'ar',
      'يتم تسليم الجواز فقط لصاحب العلاقة أو أحد الأقرباء من الدرجة الأولى: الأب، الأم، الأخ، الأخت، الابن، أو الابنة.');
    await upsertAnswerTranslation(pool, qid, 'en',
      'The passport can only be collected by the applicant or a first-degree relative: father, mother, brother, sister, son, or daughter.');
    for (const kw of ['استلام','صاحب العلاقة','درجة اولى','اب','ام','اخ','اخت','ابن','ابنة'])
      await upsertKeyword(pool, qid, 'ar', kw);
    for (const kw of ['collect','applicant','first degree relative','father','mother','brother','sister','son','daughter'])
      await upsertKeyword(pool, qid, 'en', kw);
    for (const tag of ['جواز']) await linkQuestionTag(pool, qid, arTagMap.get(tag)!);
    for (const tag of ['passport']) await linkQuestionTag(pool, qid, enTagMap.get(tag)!);
  }

  // ── PASSPORT_REVIEW_CARD_VALIDITY ──────────────────────────────────────────
  {
    const qid = await getOrCreateQuestion(pool, passportId, 'PASSPORT_REVIEW_CARD_VALIDITY', 9);
    await upsertQuestionTranslation(pool, qid, 'ar', 'هل بطاقة المراجعة صالحة للتقديم عبر واصل؟');
    await upsertQuestionTranslation(pool, qid, 'en', 'Is the review card valid for submission through Wassel?');
    await upsertAnswerTranslation(pool, qid, 'ar',
      'يجب أن تكون بطاقة المراجعة واضحة وصالحة، وألا يتجاوز تاريخ إصدارها سنة واحدة. كما يجب أن يكون قد مضى على إصدار البطاقة أكثر من 10 أيام. يجب تزويد واصل بصورة عن بطاقة المراجعة للاستفسار عن حالة الخدمة.');
    await upsertAnswerTranslation(pool, qid, 'en',
      'The review card must be clear and valid, and its issue date must not be older than one year. More than 10 days should have passed since it was issued. A photo of the review card should be sent to Wassel to check the service status.');
    for (const kw of ['بطاقة مراجعة','صالحة','سنة','10 ايام','صورة البطاقة','حالة البطاقة'])
      await upsertKeyword(pool, qid, 'ar', kw);
    for (const kw of ['review card','valid','one year','10 days','card photo','card status'])
      await upsertKeyword(pool, qid, 'en', kw);
    for (const tag of ['بطاقة مراجعة']) await linkQuestionTag(pool, qid, arTagMap.get(tag)!);
    for (const tag of ['review card']) await linkQuestionTag(pool, qid, enTagMap.get(tag)!);
  }

  // ── PASSPORT_CAN_EXPEDITE ──────────────────────────────────────────────────
  {
    const qid = await getOrCreateQuestion(pool, passportId, 'PASSPORT_CAN_EXPEDITE', 6);
    await upsertQuestionTranslation(pool, qid, 'ar', 'هل يمكن تسريع معاملة الجواز؟');
    await upsertQuestionTranslation(pool, qid, 'en', 'Can the passport process be expedited?');
    await upsertAnswerTranslation(pool, qid, 'ar',
      'لا، لا يمكن تسريع معاملة إصدار أو تجديد الجواز.');
    await upsertAnswerTranslation(pool, qid, 'en',
      'No, the passport issuance or renewal process cannot be expedited.');
    for (const kw of ['تسريع','مستعجل','اسرع','استعجال'])
      await upsertKeyword(pool, qid, 'ar', kw);
    for (const kw of ['expedite','urgent','faster','rush'])
      await upsertKeyword(pool, qid, 'en', kw);
    for (const tag of ['جواز']) await linkQuestionTag(pool, qid, arTagMap.get(tag)!);
    for (const tag of ['passport']) await linkQuestionTag(pool, qid, enTagMap.get(tag)!);
  }

  // ── PASSPORT_BRANCHES ─────────────────────────────────────────────────────
  {
    const qid = await getOrCreateQuestion(pool, passportId, 'PASSPORT_BRANCHES', 7);
    await upsertQuestionTranslation(pool, qid, 'ar', 'ما هي عناوين فروع واصل؟');
    await upsertQuestionTranslation(pool, qid, 'en', 'What are Wassel branch addresses?');
    await upsertAnswerTranslation(pool, qid, 'ar',
      'رام الله: الماصيون، شارع إدوارد سعيد، مقابل دوار المجلس التشريعي، عمارة القلعة. نابلس: رفيديا، مقابل منتزه العائلات، عمارة عماشة. الخليل: دوار ابن رشد، بالقرب من الغرفة التجارية، عمارة جذور. مركز واصل للخدمات الأردنية: روابي، كيوسنتر، مقابل البنك العربي. القدس: شعفاط، شعفاط 45، أبراج القدس.');
    await upsertAnswerTranslation(pool, qid, 'en',
      'Ramallah: Al-Masyoun, Edward Said Street, opposite the Legislative Council roundabout, Al-Qalaa Building. Nablus: Rafidia, opposite Family Park, Amasha Building. Hebron: Ibn Rushd Roundabout, near the Chamber of Commerce, Juthoor Building. Wassel Jordanian Services Center: Rawabi, Q Center, opposite Arab Bank. Jerusalem: Shuafat, Shuafat 45, Jerusalem Towers.');
    for (const kw of ['فروع','عنوان','رام الله','نابلس','الخليل','روابي','القدس','شعفاط'])
      await upsertKeyword(pool, qid, 'ar', kw);
    for (const kw of ['branches','address','Ramallah','Nablus','Hebron','Rawabi','Jerusalem','Shuafat'])
      await upsertKeyword(pool, qid, 'en', kw);
    for (const tag of ['فروع','روابي']) await linkQuestionTag(pool, qid, arTagMap.get(tag)!);
    for (const tag of ['branches','Rawabi']) await linkQuestionTag(pool, qid, enTagMap.get(tag)!);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUESTIONS — INTERNATIONAL_SHIPPING
  // ═══════════════════════════════════════════════════════════════════════════

  // ── INTERNATIONAL_SHIPPING_OVERVIEW ───────────────────────────────────────
  {
    const qid = await getOrCreateQuestion(pool, intlShippingId, 'INTERNATIONAL_SHIPPING_OVERVIEW', 9);
    await upsertQuestionTranslation(pool, qid, 'ar', 'ما هي خدمة النقل الدولي من واصل؟');
    await upsertQuestionTranslation(pool, qid, 'en', 'What is Wassel international shipping service?');
    await upsertAnswerTranslation(pool, qid, 'ar',
      'تغطي عمليات الاستيراد والتصدير التي تديرها واصل أكثر من 200 وجهة حول العالم، وتوفر خدمة التوصيل السريع دوليًا للطرود والوثائق المهمة والمستعجلة من خلال شركات الشحن السريع مثل فيديكس ودي إتش إل.');
    await upsertAnswerTranslation(pool, qid, 'en',
      'Wassel manages import and export operations to more than 200 destinations worldwide and provides international express delivery for parcels and important urgent documents through express carriers such as FedEx and DHL.');
    for (const kw of ['نقل دولي','شحن دولي','استيراد','تصدير','طرود','وثائق','فيديكس','دي اتش ال'])
      await upsertKeyword(pool, qid, 'ar', kw);
    for (const kw of ['international shipping','import','export','parcels','documents','FedEx','DHL'])
      await upsertKeyword(pool, qid, 'en', kw);
    for (const tag of ['نقل دولي','شحن دولي','فيديكس','دي اتش ال'])
      await linkQuestionTag(pool, qid, arTagMap.get(tag)!);
    for (const tag of ['international shipping','FedEx','DHL'])
      await linkQuestionTag(pool, qid, enTagMap.get(tag)!);
  }

  // ── INTERNATIONAL_SHIPPING_SERVICES ───────────────────────────────────────
  {
    const qid = await getOrCreateQuestion(pool, intlShippingId, 'INTERNATIONAL_SHIPPING_SERVICES', 8);
    await upsertQuestionTranslation(pool, qid, 'ar', 'ما هي خدمات الشحن والنقل الدولي المتوفرة؟');
    await upsertQuestionTranslation(pool, qid, 'en', 'What international shipping services are available?');
    await upsertAnswerTranslation(pool, qid, 'ar',
      'تشمل خدمات النقل الدولي من واصل: خدمة الاستيراد، خدمة التصدير، خدمات الشحن البري والبحري والجوي، وخدمات التخليص الجمركي.');
    await upsertAnswerTranslation(pool, qid, 'en',
      'Wassel international services include import, export, land freight, sea freight, air freight, and customs clearance services.');
    for (const kw of ['استيراد','تصدير','شحن بري','شحن بحري','شحن جوي','تخليص جمركي'])
      await upsertKeyword(pool, qid, 'ar', kw);
    for (const kw of ['import','export','land freight','sea freight','air freight','customs clearance'])
      await upsertKeyword(pool, qid, 'en', kw);
    for (const tag of ['نقل دولي','استيراد','تصدير','تخليص جمركي'])
      await linkQuestionTag(pool, qid, arTagMap.get(tag)!);
    for (const tag of ['international shipping','import','export','customs clearance'])
      await linkQuestionTag(pool, qid, enTagMap.get(tag)!);
  }

  // ── INTERNATIONAL_SHIPPING_REQUIRED_INFO ──────────────────────────────────
  {
    const qid = await getOrCreateQuestion(pool, intlShippingId, 'INTERNATIONAL_SHIPPING_REQUIRED_INFO', 10);
    await upsertQuestionTranslation(pool, qid, 'ar', 'ما المعلومات المطلوبة للحصول على عرض سعر للشحن الدولي؟');
    await upsertQuestionTranslation(pool, qid, 'en', 'What information is required to get an international shipping quote?');
    await upsertAnswerTranslation(pool, qid, 'ar',
      'للحصول على أفضل عرض سعر وخدمة تسليم، يرجى تزويد واصل بالمعلومات التالية: نوع البريد المراد نقله، العدد والوزن التقريبي، عنوان الاستلام والتسليم، موعد النقل المطلوب، ورقم خاص للتواصل.');
    await upsertAnswerTranslation(pool, qid, 'en',
      'To provide the best quote and delivery service, Wassel needs: the type of item to be shipped, quantity and approximate weight, pickup and delivery addresses, requested shipping date, and a contact number.');
    for (const kw of ['عرض سعر','سعر شحن','وزن','عدد','عنوان استلام','عنوان تسليم','موعد النقل','رقم تواصل'])
      await upsertKeyword(pool, qid, 'ar', kw);
    for (const kw of ['quote','shipping price','weight','quantity','pickup address','delivery address','shipping date','contact number'])
      await upsertKeyword(pool, qid, 'en', kw);
    for (const tag of ['شحن دولي','عرض سعر']) await linkQuestionTag(pool, qid, arTagMap.get(tag)!);
    for (const tag of ['international shipping','quote']) await linkQuestionTag(pool, qid, enTagMap.get(tag)!);
  }

  // ── INTERNATIONAL_SHIPPING_DELIVERY_TIME ──────────────────────────────────
  {
    const qid = await getOrCreateQuestion(pool, intlShippingId, 'INTERNATIONAL_SHIPPING_DELIVERY_TIME', 7);
    await upsertQuestionTranslation(pool, qid, 'ar', 'كم مدة التوصيل الدولي المتوقعة؟');
    await upsertQuestionTranslation(pool, qid, 'en', 'What is the expected international delivery time?');
    await upsertAnswerTranslation(pool, qid, 'ar',
      'تقدم واصل حلولًا لإيصال الطرود والوثائق المهمة والمستعجلة دوليًا في مدة أقصاها 72 ساعة من لحظة الاستلام، حسب الخدمة والوجهة وشركة الشحن.');
    await upsertAnswerTranslation(pool, qid, 'en',
      'Wassel provides solutions for delivering important and urgent parcels and documents internationally within up to 72 hours from pickup, depending on the service, destination, and carrier.');
    for (const kw of ['مدة','وقت','توصيل','72 ساعة','طرد','وثائق'])
      await upsertKeyword(pool, qid, 'ar', kw);
    for (const kw of ['duration','delivery time','72 hours','parcel','documents'])
      await upsertKeyword(pool, qid, 'en', kw);
    for (const tag of ['نقل دولي']) await linkQuestionTag(pool, qid, arTagMap.get(tag)!);
    for (const tag of ['international shipping']) await linkQuestionTag(pool, qid, enTagMap.get(tag)!);
  }

  // ── INTERNATIONAL_SHIPPING_BRANCHES ───────────────────────────────────────
  {
    const qid = await getOrCreateQuestion(pool, intlShippingId, 'INTERNATIONAL_SHIPPING_BRANCHES', 6);
    await upsertQuestionTranslation(pool, qid, 'ar', 'ما هي عناوين فروع واصل لخدمات النقل؟');
    await upsertQuestionTranslation(pool, qid, 'en', 'What are Wassel branch addresses for shipping services?');
    await upsertAnswerTranslation(pool, qid, 'ar',
      'رام الله: الماصيون، شارع إدوارد سعيد، مقابل دوار المجلس التشريعي، عمارة القلعة. نابلس: رفيديا، مقابل منتزه العائلات، عمارة عماشة. الخليل: دوار ابن رشد، بالقرب من الغرفة التجارية، عمارة جذور. مركز الخدمات الأردنية: روابي، كيوسنتر، مقابل البنك العربي. القدس: شعفاط، شعفاط 45، أبراج القدس.');
    await upsertAnswerTranslation(pool, qid, 'en',
      'Ramallah: Al-Masyoun, Edward Said Street, opposite the Legislative Council roundabout, Al-Qalaa Building. Nablus: Rafidia, opposite Family Park, Amasha Building. Hebron: Ibn Rushd Roundabout, near the Chamber of Commerce, Juthoor Building. Jordanian Services Center: Rawabi, Q Center, opposite Arab Bank. Jerusalem: Shuafat, Shuafat 45, Jerusalem Towers.');
    for (const kw of ['فروع','عنوان','رام الله','نابلس','الخليل','روابي','القدس','نقل','شحن'])
      await upsertKeyword(pool, qid, 'ar', kw);
    for (const kw of ['branches','address','Ramallah','Nablus','Hebron','Rawabi','Jerusalem','shipping'])
      await upsertKeyword(pool, qid, 'en', kw);
    for (const tag of ['فروع','شحن دولي']) await linkQuestionTag(pool, qid, arTagMap.get(tag)!);
    for (const tag of ['branches','international shipping']) await linkQuestionTag(pool, qid, enTagMap.get(tag)!);
  }

  logger.info('KB seed: completed successfully.');
}
