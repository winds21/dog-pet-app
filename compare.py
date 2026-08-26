import urllib.request

# 读取本地构建的 auth chunk
with open(r'd:\OneDrive - FanXin\code\宠物展示学习ai项目\frontend\dist\assets\auth-BO72iHPx.js', 'r', encoding='utf-8') as f:
    content = f.read()
print("=== 本地构建 auth-BO72iHPx.js ===")
print(content)
print()

# 对比线上
online = urllib.request.urlopen('https://dog-pet-app.vercel.app/assets/auth-DqZqpYBL.js').read().decode()
print("=== 线上 auth-DqZqpYBL.js ===")
print(online)
