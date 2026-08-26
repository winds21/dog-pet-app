import urllib.request
import re
import json

# 1. 拉取 Vercel 主页 HTML
html = urllib.request.urlopen('https://dog-pet-app.vercel.app/').read().decode()
js_files = re.findall(r'assets/[^"\']+\.js', html)
print(f"Vercel 主页 JS 文件: {js_files}")

# 2. 下载所有 chunk，找 auth 相关的
print("\n=== 检查所有 JS 文件 ===")
for js_name in set(js_files):
    url = f'https://dog-pet-app.vercel.app/{js_name}'
    content = urllib.request.urlopen(url).read().decode()
    # 找包含 auth 的
    if 'auth' in content.lower() and ('register' in content or 'login' in content):
        print(f"\n>>> {js_name} ({len(content)} bytes) <<<")
        # 检查关键字符串
        if '/api/pet/api/auth' in content:
            print("  [BUG] 双重路径 /api/pet/api/auth 仍存在!")
        if 'railway.app' in content:
            # 提取 railway 地址附近的代码
            idx = content.find('railway.app')
            start = max(0, idx - 100)
            end = min(len(content), idx + 150)
            print(f"  [铁路地址上下文]: ...{content[start:end]}...")
        if '/api/auth' in content and '/api/pet/api/auth' not in content:
            print("  [OK] 路径正确")

# 3. 尝试下载所有 chunk - 通过 __vite__mapDeps 找完整的 chunk 列表
print("\n=== 找所有 chunk ===")
main_js = js_files[0]
main_content = urllib.request.urlopen(f'https://dog-pet-app.vercel.app/{main_js}').read().decode()
# 找 __vite__mapDeps 里的所有 chunk 名
chunks = re.findall(r'"\./([^"]+\.js)"', main_content)
print(f"所有 chunk: {chunks}")

for chunk in chunks:
    url = f'https://dog-pet-app.vercel.app/assets/{chunk.replace("./", "")}'
    try:
        content = urllib.request.urlopen(url).read().decode()
        if 'railway' in content or 'api/auth' in content or 'api/pet' in content:
            print(f"\n>>> {chunk} ({len(content)} bytes) <<<")
            print(content[:500])
            if '/api/pet/api/auth' in content:
                print("  [BUG] 双重路径!")
            elif '/api/auth' in content:
                print("  [OK] auth 路径正确")
    except Exception as e:
        print(f"  {chunk}: 读取失败 {e}")

# 4. 直接测试后端注册接口
print("\n=== 直接测试后端 ===")
req = urllib.request.Request(
    'https://dog-pet-app-production-8743.up.railway.app/api/auth/register',
    data=json.dumps({'username': 'final_test_001', 'password': 'test12345'}).encode(),
    headers={'Content-Type': 'application/json'}
)
try:
    resp = urllib.request.urlopen(req, timeout=15)
    print(f"  状态码: {resp.status}")
    print(f"  响应: {resp.read().decode()[:200]}")
except urllib.error.HTTPError as e:
    print(f"  HTTP 错误: {e.code}")
    print(f"  响应: {e.read().decode()}")
