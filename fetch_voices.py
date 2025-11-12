import os
import requests
import json

# Read API key from .env
with open('.env', 'r') as f:
    for line in f:
        if line.startswith('ELEVEN_LABS_API_KEY='):
            api_key = line.split('=', 1)[1].strip()
            break

print('🔍 Fetching voices from Eleven Labs API...\n')

headers = {
    'xi-api-key': api_key,
    'Content-Type': 'application/json'
}

try:
    response = requests.get('https://api.elevenlabs.io/v1/voices', headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        voices = data.get('voices', [])
        
        print(f'✅ Total voices: {len(voices)}\n')
        print('=' * 80)
        
        # Filter premade/default voices
        premade = [v for v in voices if v.get('category') == 'premade']
        
        print(f'\n🎤 PREMADE/DEFAULT VOICES: {len(premade)}\n')
        
        for i, voice in enumerate(premade, 1):
            name = voice.get('name', 'Unknown')
            voice_id = voice.get('voice_id', '')
            labels = voice.get('labels', {})
            
            accent = labels.get('accent', 'Unknown')
            gender = labels.get('gender', 'Unknown')
            language = labels.get('language', 'English')
            
            print(f'{i}. {name}')
            print(f'   ID: {voice_id}')
            print(f'   Gender: {gender} | Language: {language} | Accent: {accent}')
            print()
        
        # Save to file
        with open('voices_premium.json', 'w') as f:
            json.dump(premade, f, indent=2)
        
        print(f'\n💾 Premium voices saved to: voices_premium.json')
        
    else:
        print(f'❌ API Error: {response.status_code}')
        print(response.text)
        
except Exception as e:
    print(f'❌ Error: {str(e)}')
