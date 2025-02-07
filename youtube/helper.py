# load key from ~/.social_media_stats
import os

from youtube.config import output_dir


def load_properties(filepath):
    properties = {}
    with open(filepath, 'r') as file:
        for line in file:
            line = line.strip()
            if line and not line.startswith('#'):
                key, value = line.split('=', 1)
                properties[key.strip()] = value.strip()
    return properties


def get_google_api_key():
    config_file = '~/.social_media_stats'
    config_path = os.path.expanduser(config_file)
    if not os.path.exists(config_path):
        raise ValueError(f"File not found: {config_path}")
    config = load_properties(config_path)
    return config['GOOGLE_API_KEY']


def to_hours(millis: int):
    return round(millis / 1000 / 60 / 60, 2)


def to_minutes(millis: int):
    return round(millis / 1000 / 60, 2)