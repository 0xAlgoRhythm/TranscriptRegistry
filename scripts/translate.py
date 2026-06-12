import json
import os
import time
from deep_translator import GoogleTranslator

# Paths
en_path = os.path.join(os.path.dirname(__file__), '../frontend/messages/en.json')
es_path = os.path.join(os.path.dirname(__file__), '../frontend/messages/es.json')

# Load files
with open(en_path, 'r', encoding='utf-8') as f:
    en_dict = json.load(f)

if os.path.exists(es_path):
    with open(es_path, 'r', encoding='utf-8') as f:
        es_dict = json.load(f)
else:
    es_dict = {}

translator = GoogleTranslator(source='en', target='es')

total_translations = 0

def translate_node(en_node, es_node):
    global total_translations
    for key, value in en_node.items():
        if isinstance(value, dict):
            if key not in es_node or not isinstance(es_node[key], dict):
                es_node[key] = {}
            translate_node(value, es_node[key])
        elif isinstance(value, str):
            # Only translate if missing or if we want to overwrite
            if key not in es_node:
                try:
                    # Sleep slightly to avoid rate limit
                    if total_translations > 0 and total_translations % 20 == 0:
                        time.sleep(1)
                    
                    # Handle empty strings
                    if not value.strip():
                        es_node[key] = value
                        continue
                        
                    translated = translator.translate(value)
                    es_node[key] = translated
                    total_translations += 1
                except Exception as e:
                    es_node[key] = value # Fallback to english

translate_node(en_dict, es_dict)

with open(es_path, 'w', encoding='utf-8') as f:
    json.dump(es_dict, f, ensure_ascii=False, indent=2)

print(f"Done! Translated {total_translations} new keys to Spanish.")
