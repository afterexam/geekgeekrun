import { saveGptCompletionRequestRecord, saveChatMessageRecord } from '@geekgeekrun/sqlite-plugin/dist/handlers'
import { ChatMessageRecord } from '@geekgeekrun/sqlite-plugin/dist/entity/ChatMessageRecord'
import { UserInfo } from '@geekgeekrun/sqlite-plugin/dist/entity/UserInfo'

export enum RequestSceneEnum {
  testing = 1,
  readNoReplyAutoReminder = 2,
  geekAutoStartChatWithBoss = 3
}

let dbInitPromise
export const recordGptCompletionRequest = async (payload) => {
  const { getPublicDbFilePath } = await import(
    '@geekgeekrun/geek-auto-start-chat-with-boss/runtime-file-utils.mjs'
  )
  const { initDb } = await import('@geekgeekrun/sqlite-plugin')

  if (!dbInitPromise) {
    dbInitPromise = initDb(getPublicDbFilePath())
  }
  const ds = await dbInitPromise
  const o = { ...payload }
  await saveGptCompletionRequestRecord(ds, [o])
}

// 把一段 HR 对话的轮次写进 chat_message_record。
// 消息来源是 LLM 输入用的同一份 history（可靠），不再依赖抠 BOSS 页面 Vue 内部状态。
// 会话标识用 encryptFromUserId + encryptToUserId 这一对（同一对用户即同一段 HR 对话）。
// mid 若存在则原样写入，重复保存时按主键 upsert，不产生重复行。内部吞掉全部异常，绝不阻塞对话。
export const recordChatMessages = async (
  chatRecords: Array<{
    isSelf: boolean
    text?: string
    mid?: number
    time?: number | string | Date
    type?: string
    style?: string
    messageType?: string
  }>,
  encryptBossId: string
) => {
  try {
    const { getPublicDbFilePath } = await import(
      '@geekgeekrun/geek-auto-start-chat-with-boss/runtime-file-utils.mjs'
    )
    const { initDb } = await import('@geekgeekrun/sqlite-plugin')

    if (!dbInitPromise) {
      dbInitPromise = initDb(getPublicDbFilePath())
    }
    const ds = await dbInitPromise
    const users = await ds.getRepository(UserInfo).find()
    const encryptUserId = users?.[0]?.encryptUserId
    if (!encryptUserId || !encryptBossId) return

    const records = chatRecords
      .filter((r) => (r.text ?? '').trim())
      .map((r) => {
        const o = new ChatMessageRecord()
        if (typeof r.mid === 'number') o.mid = r.mid
        o.encryptFromUserId = r.isSelf ? encryptUserId : encryptBossId
        o.encryptToUserId = r.isSelf ? encryptBossId : encryptUserId
        o.style = r.isSelf ? 'sent' : 'received'
        o.type = (r.type as ChatMessageRecord['type']) || 'text'
        o.time = r.time ? new Date(r.time) : null
        o.text = r.text as string
        return o
      })
    if (!records.length) return
    await saveChatMessageRecord(ds, records)
  } catch (err) {
    console.log('CANNOT_SAVE_CHAT_MESSAGE_RECORD', err)
  }
}

