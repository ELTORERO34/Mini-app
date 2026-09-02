import os
import html
import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.filters import CommandStart
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TOKEN = os.getenv("BOT_TOKEN")

MINI_APP_URL = "https://eltorero34.github.io/Mini-app/"
CANAL_URL = "https://t.me/+A3I9s-CoaKQzNjNk"
CONTACT_URL = "https://t.me/offpss"
INSTAGRAM_URL = "https://instagram.com/PochonStore"
# Photo produit (format large, pas la bannière fine du logo) : rend
# beaucoup plus "grande photo" et pro dans le message /start.
BANNER_URL = MINI_APP_URL + "img/pochons22.jpg"

bot = Bot(token=TOKEN)
dp = Dispatcher()


def build_start_keyboard() -> InlineKeyboardMarkup:
    # Mini-App seule sur sa ligne, en premier : c'est l'action principale,
    # elle doit sauter aux yeux avant les liens secondaires.
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🛍️ Ouvrir la boutique",
                    web_app=WebAppInfo(url=MINI_APP_URL)
                )
            ],
            [
                InlineKeyboardButton(text="📢 Canal", url=CANAL_URL),
                InlineKeyboardButton(text="💬 Contact", url=CONTACT_URL)
            ],
            [
                InlineKeyboardButton(text="📸 Instagram", url=INSTAGRAM_URL)
            ]
        ]
    )


@dp.message(CommandStart())
async def start(message: Message):
    # html.escape évite qu'un prénom contenant "<", ">" ou "&" casse le
    # parse_mode HTML (Telegram renverrait une erreur "can't parse entities").
    first_name = html.escape(message.from_user.first_name or "")

    caption = (
        "<b>🛍️ PochonStore</b>\n"
        f"Bienvenue {first_name} ! 👋\n\n"
        "✨ <b>Pochons, cartes, étiquettes, packs complets...</b>\n"
        "📦 Suivi de commande en direct\n"
        "💬 Devis instantané, sans prise de tête\n\n"
        "👇 Découvre toute la boutique juste en dessous."
    )

    keyboard = build_start_keyboard()

    try:
        await message.answer_photo(
            photo=BANNER_URL,
            caption=caption,
            parse_mode="HTML",
            reply_markup=keyboard
        )
    except Exception as e:
        # Si l'envoi de la photo échoue (image injoignable, etc.), on
        # retombe sur un simple message texte plutôt que de laisser
        # l'utilisateur sans aucune réponse.
        logger.error("Échec de l'envoi de la photo /start : %s", e)
        await message.answer(
            caption,
            parse_mode="HTML",
            reply_markup=keyboard
        )


async def main():
    if not TOKEN:
        raise RuntimeError(
            "La variable d'environnement BOT_TOKEN n'est pas définie."
        )
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
