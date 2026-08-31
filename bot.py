import os
import asyncio
from aiogram import Bot, Dispatcher
from aiogram.filters import CommandStart
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

TOKEN = os.getenv("BOT_TOKEN")

bot = Bot(token=TOKEN)
dp = Dispatcher()


@dp.message(CommandStart())
async def start(message: Message):

    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="📢 Canal", url="https://t.me/TON_CANAL"),
                InlineKeyboardButton(text="🛟 Backup", url="https://t.me/TON_BACKUP")
            ],
            [
                InlineKeyboardButton(
                    text="🔌 Mini-App",
                    web_app=WebAppInfo(url="https://TON-LIEN-MINI-APP")
                )
            ],
            [
                InlineKeyboardButton(text="💬 Contact", url="https://t.me/TON_CONTACT"),
                InlineKeyboardButton(text="📸 Instagram", url="https://instagram.com/TON_INSTAGRAM")
            ]
        ]
    )

    await message.answer(
        f"👋 Bienvenue {message.from_user.first_name} !\n\n"
        "📲 Explore les options ci-dessous pour commencer.",
        reply_markup=keyboard
    )


async def main():
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())