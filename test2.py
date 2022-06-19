from asyncio.windows_events import NULL
import time
from time import sleep
from PIL import Image, ImageDraw, ImageFont
import subprocess


width = 160
height = 128

image = Image.new("RGB", (width, height))
draw = ImageDraw.Draw(image)
image.save("test.png")
x = 1
y = 0
font = ImageFont.truetype("./font/DSEG14ClassicMini-Bold.ttf", 20)

SUBSTR = "123456789"
draw.text((x, y), SUBSTR, font=font, fill="#F100FF")

image.save("test2.png")
