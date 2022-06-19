# -*- coding: utf-8 -*-
"""
This program is based on the sample program at Adafruit-Python-Usage.
(https://learn.adafruit.com/1-8-tft-display/python-usage)

2021/09/06 var1.0
"""

from curses.ascii import STX
import digitalio
import board
import RPi.GPIO as GPIO
import time
from time import sleep
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
import requests
import json

# url = "http://10.0.1.61:3000/api/get_data"
# response = requests.get(url)
# jsonData = response.json()
# print(jsonData)

VERSION = "0.1.1"

import adafruit_rgb_display.st7735 as st7735
import subprocess

seg = ["", "", "", "", "", "", "", "", "", "", "", "", "", ""]
# 


class dataget:
    def __init__(self, host="http://10.0.1.61:3000"):
        self.host = host
        self.olddata = {}
        self.olddatalog = {}
        self.get_now_data()
        self.get_log_data()

    def get_now_data(self):
        url = self.host + "/api/get_data"
        response = requests.get(url)
        self.data = response.json()
        if self.data == self.olddata:
            return False
        else:
            self.olddatalog = self.olddata
            self.olddata = self.data
            return True

    def get_log_data(self):
        url = self.host + "/api/get_slotlog"
        response = requests.get(url)
        self.logdata = response.json()

    def makegraphdata(self):
        old_cnt = 9999999
        result = []
        for d in self.logdata["data"]:
            if old_cnt > d["all_rcnt"]:
                old_cnt = d["all_rcnt"]
            else:
                break
            if d["slot_status"] == 0:
                result.append(d["rcnt"])
        return result


class DisplayView:
    def __init__(
        self,
        display,
        width=160,
        height=128,
        default_font_path="./font/TsunagiGothic.ttf",
        default_font_size=14,
    ):
        self.display = display
        self.image = Image.new("RGB", (width, height))
        self.draw = ImageDraw.Draw(self.image)
        self.font = ImageFont.truetype(default_font_path, default_font_size)
        self.text_pos_y = 0
        self.width = width
        self.height = height
        self.reset_image()

    def segfont(self, font_size=20):
        return ImageFont.truetype("./font/DSEG14ClassicMini-Bold.ttf", font_size)

    def setfont(self, font_path="./font/TsunagiGothic.ttf", font_size=14):
        self.font = ImageFont.truetype(font_path, font_size)

    def save(self, path="test1.png"):
        self.image.save(path)

    def reset_image(self):
        # self.draw.rectangle((0, 0, self.width, self.height), outline=0, fill=(0, 0, 0))
        self.image = Image.new("RGB", (width, height))
        self.draw = ImageDraw.Draw(self.image)
        self.text_pos_y = 0

    def textdraw(self, text="test text", font=None, color="#FFFFFF"):
        if font is None:
            font = self.font
        # print(self.text_pos_y)
        self.draw.text((0, self.text_pos_y), text, font=font, fill=color)
        self.text_pos_y += font.getsize(text)[1]
        # print(text)

    def drawdisp(self):
        self.display.image(self.image)

    def sleepdraw(self):
        self.reset_image()
        text = "リゼロ"
        font = ImageFont.truetype("./font/TsunagiGothic.ttf", 20)
        x = (self.width / 2) - (font.getsize(text)[0] / 2)
        y = 20
        self.draw.text((x, y), text, font=font, fill="#FFFFFF")

        y = y + font.getsize(text)[1]
        text = "データカウンタ"
        x = (self.width / 2) - (font.getsize(text)[0] / 2)
        self.draw.text((x, y), text, font=font, fill="#FFFFFF")
        y = y + font.getsize(text)[1]
        y = y + font.getsize(text)[1]
        text = "待機中"
        x = (self.width / 2) - (font.getsize(text)[0] / 2)
        self.draw.text((x, y), text, font=font, fill="#999999")

        font = ImageFont.truetype("./font/TsunagiGothic.ttf", 16)
        cmd = "hostname -I | cut -d' ' -f1"
        text = subprocess.check_output(cmd, shell=True).decode("utf-8")
        y = self.height - font.getsize(text)[1]
        x = 0
        self.draw.text((x, y), text, font=font, fill="#EEEEEE")
        self.drawdisp()

        text = "v" + VERSION
        y = self.height - font.getsize(text)[1]
        x = self.width - font.getsize(text)[0]
        self.draw.text((x, y), text, font=font, fill="#EEEEEE")
        self.drawdisp()

    def splash(self):
        self.reset_image()
        text = "リゼロ"
        font = ImageFont.truetype("./font/TsunagiGothic.ttf", 20)
        x = (self.width / 2) - (font.getsize(text)[0] / 2)
        y = 20
        self.draw.text((x, y), text, font=font, fill="#FFFFFF")

        y = y + font.getsize(text)[1]
        text = "データカウンタ"
        x = (self.width / 2) - (font.getsize(text)[0] / 2)
        self.draw.text((x, y), text, font=font, fill="#FFFFFF")
        font = ImageFont.truetype("./font/TsunagiGothic.ttf", 16)
        cmd = "hostname -I | cut -d' ' -f1"
        exec_getip = True
        self.drawdisp()
        while exec_getip:
            text = subprocess.check_output(cmd, shell=True).decode("utf-8")
            if text.startswith("10"):
                exec_getip = False
                text = "IP:" + text
            else:
                text = "wifi connecting.."
            print("[" + text[:-1] + "]")
            x = self.width - font.getsize(text)[0]
            x = 0
            y = self.height - font.getsize(text)[1]
            self.draw.rectangle(
                (
                    x,
                    y,
                    x + font.getsize("wifi connecting..")[0],
                    y + font.getsize("wifi connecting..")[1],
                ),
                outline=0,
                fill=(0, 0, 0),
            )
            self.draw.text((x, y), text, font=font, fill="#EEEEEE")
            self.drawdisp()
            sleep(0.5)

        text = "v" + VERSION
        y = self.height - font.getsize(text)[1]
        x = self.width - font.getsize(text)[0]
        self.draw.text((x, y), text, font=font, fill="#EEEEEE")
        self.drawdisp()
        sleep(1)
        # self.image = Image.open("./splash.png")
        # self.draw = ImageDraw.Draw(self.image)
        self.reset_image()
        # self.textdraw(self.image.mode)
        # self.draw.rectangle((0, 0, 160, 128), fill=(0, 0, 0, 20))
        self.drawdisp()

    def rushdraw(self, data):
        # self.draw.rectangle((0, 0, 160, 128), outline=0, fill=(0, 255, 0))
        # self.back_image = Image.open("splash.png")
        self.draw.rectangle((0, 0, 160, 27), outline=0, fill=(0, 0, 0))
        self.draw.text(
            (0, 0),
            " " * 10,
            font=ImageFont.truetype("./font/nkd02_14-segment_hematitic.ttf", 30),
            fill="#191919",
        )
        cnt = str(data)
        text = " " * (6 - len(cnt)) + cnt
        self.draw.text(
            (0, 0),
            "RUSH" + text,
            font=ImageFont.truetype("./font/nkd02_14-segment_hematitic.ttf", 30),
            fill="#2222E1",
        )

    def hakugeidraw(self, data):

        self.draw.rectangle((0, 28, 160, 45), outline=0, fill=(0, 0, 0))
        self.draw.text(
            (0, 28),
            " " * 16,
            font=ImageFont.truetype("./font/nkd02_14-segment_hematitic.ttf", 18),
            fill="#191919",
        )
        cnt = str(data)
        text = " " * (9 - len(cnt)) + cnt
        self.draw.text(
            (0, 28),
            "HAKUGEI" + text,
            font=ImageFont.truetype("./font/nkd02_14-segment_hematitic.ttf", 18),
            fill="#E14242",
        )

    def allstartdraw(self, data):
        self.draw.rectangle((0, 46, 160, 63), outline=0, fill=(0, 0, 0))
        cnt = str(data)
        text = " " * (7 - len(cnt)) + cnt
        self.draw.text(
            (0, 46),
            " " * 16,
            font=ImageFont.truetype("./font/nkd02_14-segment_hematitic.ttf", 18),
            fill="#191919",
        )
        self.draw.text(
            (0, 46),
            "ALL-START" + text,
            font=ImageFont.truetype("./font/nkd02_14-segment_hematitic.ttf", 18),
            fill="#42E142",
        )

    def medaldraw(self, data):
        self.draw.rectangle((0, 63, 160, 82), outline=0, fill=(0, 0, 0))
        cnt = str(data)
        text = " " * (11 - len(cnt)) + cnt
        self.draw.text(
            (0, 63),
            " " * 16,
            font=ImageFont.truetype("./font/nkd02_14-segment_hematitic.ttf", 18),
            fill="#191919",
        )
        self.draw.text(
            (0, 63),
            "MEDAL" + text,
            font=ImageFont.truetype("./font/nkd02_14-segment_hematitic.ttf", 18),
            fill="#12E2E2",
        )

    def startdraw(self, data):
        font = ImageFont.truetype("./font/nkd02_14-segment_hematitic.ttf", 18)
        x = font.getsize(" " * 7)[0]
        self.draw.rectangle((0, 85, x, 128), outline=0, fill=(0, 0, 0))
        cnt = str(data)
        text = " " * (5 - len(cnt)) + cnt

        y = 85
        self.draw.text(
            (0, y),
            " " * 7,
            font=ImageFont.truetype("./font/nkd02_14-segment_hematitic.ttf", 18),
            fill="#191919",
        )
        self.draw.text(
            (0, y),
            " START ",
            font=ImageFont.truetype("./font/nkd02_14-segment_hematitic.ttf", 18),
            fill="#E212E2",
        )
        y = y + font.getsize(" " * 16)[1] + 3
        self.draw.text(
            (0, y),
            " " * 5,
            font=ImageFont.truetype("./font/nkd02_14-segment_hematitic.ttf", 24),
            fill="#191919",
        )
        self.draw.text(
            (0, y),
            text,
            font=ImageFont.truetype("./font/nkd02_14-segment_hematitic.ttf", 24),
            fill="#E212E2",
        )

    def graphdraw(self, data):
        self.draw.rectangle((71, 85, 160, 128), outline=0, fill=(0, 0, 0))
        print("call_graph draw")
        print(data)
        # 90 43
        for ii in range(11):
            bar_width = 7
            sx = 71 + ((bar_width + 1) * ii)
            ex = sx + 7
            for i in range(9):
                i += 1
                sy = 83 + 5 * (i - 1)
                ey = 83 + 5 * i - 1
                # i = 5 * 1
                fill = (20, 20, 20)
                if len(data) > ii:
                    # print(int(data[ii] / 100))
                    if 9 - i < int(data[ii] / 100):
                        if ii == 0:
                            fill = (230, 250, 220)
                        else:
                            fill = (220, 150, 40)
                self.draw.rectangle((sx, sy, ex, ey), outline=0, fill=fill)


cs_pin = digitalio.DigitalInOut(board.CE0)
dc_pin = digitalio.DigitalInOut(board.D25)
reset_pin = digitalio.DigitalInOut(board.D24)
# backlight_pin = digitalio.DigitalInOut(board.D12)
backlight_pin = 12
WIDTH = 160
HEIGHT = 128
BAUDRATE = 24000000

# 使用する液晶が異なる場合、サイトを参考に以下を書き換えてください。
# ----------ここから----------
disp = st7735.ST7735R(
    board.SPI(),
    rotation=270,
    cs=cs_pin,
    dc=dc_pin,
    rst=reset_pin,
    # bl=backlight_pin,
    baudrate=BAUDRATE,
    x_offset=2,
    y_offset=1,
)
# ----------ここまで----------

GPIO.setmode(GPIO.BCM)
GPIO.setup(backlight_pin, GPIO.OUT)


class DisplayImage:
    def __init__(self, img):
        self.image = Image.open(img)

    def show(self):
        # 画像サイズと液晶サイズが異なると、上手く表示されない可能性があります
        disp.image(self.image)


class DisplayControl:
    def __init__(self):
        self.backlight = GPIO.PWM(backlight_pin, 100)
        self.backlight.start(0)

    def on(self):
        self.backlight.ChangeDutyCycle(100)

    def off(self):
        black = Image.new("RGB", (160, 128))
        # black = Image.new("RGB", (180, 160))
        draw = ImageDraw.Draw(black)
        draw.rectangle((0, 0, 160, 128), outline=0, fill=(0, 0, 0))
        disp.image(black)
        self.backlight.ChangeDutyCycle(0)

    def pwm(self, value):
        self.backlight.ChangeDutyCycle(value)


if __name__ == "__main__":
    print("start")
    DisplayCont = DisplayControl()
    DisplayCont.on()
    sleep(0.1)
    DisplayCont.off()
    sleep(0.1)
    DisplayCont.on()
    if disp.rotation % 180 == 90:
        height = disp.width  # we swap height/width to rotate it to landscape!
        width = disp.height
    else:
        width = disp.width  # we swap height/width to rotate it to landscape!
        height = disp.height

    dispview = DisplayView(display=disp, width=width, height=height)
    dispview.splash()
    dg = dataget()
    roop_cnt = 0
    is_show = False
    dispview.rushdraw(dg.data["rush"])
    dispview.graphdraw(dg.makegraphdata())
    dispview.hakugeidraw(dg.data["hakugei"])
    dispview.allstartdraw(dg.data["all_rcnt"])
    dispview.medaldraw(dg.data["m_out"] - dg.data["m_in"])
    dispview.startdraw(dg.data["rcnt"])
    dispview.drawdisp()

    while True:
        # disp.image(dispview.image)
        print("loopcnt:" + str(roop_cnt))
        if is_show:
            if dg.data["rush"] != dg.olddatalog["rush"]:
                dispview.rushdraw(dg.data["rush"])
                dispview.graphdraw(dg.makegraphdata())
            if dg.data["hakugei"] != dg.olddatalog["hakugei"]:
                dispview.hakugeidraw(dg.data["hakugei"])
                dispview.graphdraw(dg.makegraphdata())
            if dg.data["all_rcnt"] != dg.olddatalog["all_rcnt"]:
                dispview.allstartdraw(dg.data["all_rcnt"])
                dispview.medaldraw(dg.data["m_out"] - dg.data["m_in"])
                dispview.startdraw(dg.data["rcnt"])
                if dg.data["rcnt"] % 5 == 0:
                    dispview.graphdraw(dg.makegraphdata())
            dispview.drawdisp()
            if roop_cnt == 0:
                dg.get_log_data()
        result = dg.get_now_data()
        if result:
            if roop_cnt > 160:
                dispview.reset_image()
                dispview.rushdraw(dg.data["rush"])
                dispview.graphdraw(dg.makegraphdata())
                dispview.hakugeidraw(dg.data["hakugei"])
                dispview.allstartdraw(dg.data["all_rcnt"])
                dispview.medaldraw(dg.data["m_out"] - dg.data["m_in"])
                dispview.startdraw(dg.data["rcnt"])
                dispview.graphdraw(dg.makegraphdata())
            roop_cnt = 0
            DisplayCont.on()
            is_show = True
            time.sleep(0.5)
        else:
            roop_cnt += 1
            if roop_cnt > 250:
                if roop_cnt == 253:
                    dispview.sleepdraw()
                if roop_cnt == 300:
                    DisplayCont.off()
                is_show = False
                time.sleep(5)
            elif roop_cnt > 200:
                time.sleep(1)
            elif roop_cnt > 150:
                time.sleep(0.8)
            elif roop_cnt > 100:
                time.sleep(0.6)
            elif roop_cnt > 60:
                time.sleep(0.4)
            else:
                time.sleep(0.2)

    image = Image.new("RGB", (width, height))

    # Get drawing object to draw on image.
    draw = ImageDraw.Draw(image)

    # Draw a black filled box to clear the image.
    draw.rectangle((0, 0, width, height), outline=0, fill=(0, 0, 0))
    disp.image(image)

    # First define some constants to allow easy positioning of text.
    padding = 2
    x = 2

    # Load a TTF font.  Make sure the .ttf font file is in the
    # same directory as the python script!
    # Some other nice fonts to try: http://www.dafont.com/bitmap.php
    # font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 12)
    font = ImageFont.truetype("./TanukiMagic.ttf", 13)

    while False:
        # Draw a black filled box to clear the image.
        draw.rectangle((0, 0, width, height), outline=0, fill=0)

        # Shell scripts for system monitoring from here:
        # https://unix.stackexchange.com/questions/119126/command-to-display-memory-usage-disk-usage-and-cpu-load
        cmd = "hostname -I | cut -d' ' -f1"
        IP = "IP: " + subprocess.check_output(cmd, shell=True).decode("utf-8")
        cmd = "top -bn1 | grep load | awk '{printf \"CPU Load: %.2f\", $(NF-2)}'"
        CPU = subprocess.check_output(cmd, shell=True).decode("utf-8")
        cmd = (
            "free -m | awk 'NR==2{printf \"Mem: %s/%s MB  %.2f%%\", $3,$2,$3*100/$2 }'"
        )
        MemUsage = subprocess.check_output(cmd, shell=True).decode("utf-8")
        cmd = 'df -h | awk \'$NF=="/"{printf "Disk: %d/%d GB  %s", $3,$2,$5}\''
        Disk = subprocess.check_output(cmd, shell=True).decode("utf-8")
        cmd = "cat /sys/class/thermal/thermal_zone0/temp |  awk '{printf \"CPU Temp: %.1f C\", $(NF-0) / 1000}'"  # pylint: disable=line-too-long
        Temp = subprocess.check_output(cmd, shell=True).decode("utf-8")
        SUBSTR = "cpu fontsize:" + str(160 - font.getsize(CPU)[0])

        # Write four lines of text.
        y = padding
        draw.text((x, y), IP, font=font, fill="#FFFFFF")
        y += font.getsize(IP)[1]
        print(160 - font.getsize(CPU)[0])
        draw.text((160 - font.getsize(CPU)[0], y), CPU, font=font, fill="#FFFF00")
        y += font.getsize(CPU)[1]
        draw.text((x, y), MemUsage, font=font, fill="#00FF00")
        y += font.getsize(MemUsage)[1]
        draw.text((x, y), Disk, font=font, fill="#0000FF")
        y += font.getsize(Disk)[1]
        draw.text((x, y), Temp, font=font, fill="#FF00FF")
        y += font.getsize(Temp)[1]
        draw.text((x, y), SUBSTR, font=font, fill="#11F0FF")
        y += font.getsize(Temp)[1]

        # Display image.
        disp.image(image)
        time.sleep(0.5)
