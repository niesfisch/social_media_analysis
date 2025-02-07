import json

from youtube import config


def split_json_file(input_file, max_entries_per_file=9000):
    with open(input_file, 'r') as f:
        data = json.load(f)

    file_count = 1
    current_file = []

    for i, item in enumerate(data):
        current_file.append(item)
        if (i + 1) % max_entries_per_file == 0 or i == len(data) - 1:
            output_file = input_file.replace('.json', f'_{file_count}.json')
            with open(output_file, 'w') as f:
                json.dump(current_file, f, indent=4)
            print(f"written: {output_file}")
            current_file = []
            file_count += 1

input_file = config.youtube_watch_history_file
split_json_file(input_file)