import requests


def get_public_ip():
    try:
        response = requests.get('https://api.ipify.org?format=json', timeout=5)
        return response.json()['ip']
    except:
        return None


public_ip = get_public_ip()
print(f"Your public IP: {public_ip}")

