import json
import random
from faker import Faker
import datetime

fake = Faker()

def generate_random_data(num_records):
    data = []
    start_date = datetime.datetime(2022, 1, 1)
    end_date = datetime.datetime(2024, 12, 31, 23, 59, 59)
    for _ in range(num_records):
        record = {
            "ts": fake.date_time_between(start_date=start_date, end_date=end_date).isoformat(timespec='seconds') + 'Z',
            "platform": random.choice(["android", "ios", "web"]),
            "ms_played": random.randint(1000 * 10, 1000 * 60 * 30),
            "conn_country": fake.country_code(),
            "ip_addr": fake.ipv6(),
            "master_metadata_track_name": fake.sentence(nb_words=3),
            "master_metadata_album_artist_name": fake.name(),
            "master_metadata_album_album_name": fake.sentence(nb_words=3),
            "spotify_track_uri": fake.uri(),
            "episode_name": fake.sentence(nb_words=5),
            "episode_show_name": fake.name(),
            "spotify_episode_uri": fake.uri(),
            "reason_start": random.choice(["fwdbtn", "clickrow", "trackdone"]),
            "reason_end": random.choice(["endplay", "fwdbtn", "trackdone"]),
            "shuffle": fake.boolean(),
            "skipped": fake.boolean(),
            "offline": fake.boolean(),
            "offline_timestamp": int(fake.date_time_between(start_date=start_date, end_date=end_date).timestamp()),
            "incognito_mode": fake.boolean()
        }
        data.append(record)
    return data

random_data = generate_random_data(10_000)

# Save the generated data to a file
with open("data/random/random_data.json", "w") as f:
    json.dump(random_data, f, indent=4)
