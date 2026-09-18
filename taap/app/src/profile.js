/**
 * Telegram bot description, about, and command list. No profile photo here.
 */

import { env } from "./env.js";
import { setMyCommands, setMyDescription, setMyShortDescription } from "./telegram.js";

const DESC_RU =
  "ArzonTur — консультант по жилью за границей для поездок из Таджикистана. Направления: ОАЭ, Турция, Египет. Собираем заявки, ссылку Booking/TAAP пока не даём. Это не визовое агентство и не консульство. В любой момент напишите «оператор».";

const DESC_TG =
  "ArzonTur — мушовир оид ба манзил дар хориҷа барои сафар аз Тоҷикистон. Самтҳо: Имороти Муттаҳидаи Араб, Туркия, Миср. Дархост ҷамъ мекунем, пайванди Booking/TAAP ҳоло нест. Агентии раводид ва консулгарӣ нестем. «оператор» нависед — инсон ҷавоб медиҳад.";

const SHORT_RU = "Подбор жилья за границей из Таджикистана. Заявки: ОАЭ, Турция, Египет.";
const SHORT_TG = "Интихоби манзил дар хориҷа аз Тоҷикистон. Дархост: Иморот, Туркия, Миср.";

const COMMANDS_RU = [
  { command: "start", description: "Меню" },
  { command: "help", description: "Как работает бот" },
  { command: "operator", description: "Связаться с человеком" },
];

const COMMANDS_TG = [
  { command: "start", description: "Меню" },
  { command: "help", description: "Чӣ тавр кор мекунад" },
  { command: "operator", description: "Бо инсон пайваст шавед" },
];

export async function applyBotProfile() {
  if (!env("TELEGRAM_BOT_TOKEN")) {
    return { ok: false, skipped: true };
  }
  await setMyDescription(DESC_RU);
  await setMyDescription(DESC_RU, "ru");
  await setMyDescription(DESC_TG, "tg");
  await setMyShortDescription(SHORT_RU);
  await setMyShortDescription(SHORT_RU, "ru");
  await setMyShortDescription(SHORT_TG, "tg");
  await setMyCommands(COMMANDS_RU);
  await setMyCommands(COMMANDS_RU, "ru");
  await setMyCommands(COMMANDS_TG, "tg");
  return { ok: true };
}
