import os

# ------------------ CONFIGURATION ------------------
# specify a unique name for this analysis, e.g. your name or your kids name
# everytime you run these scripts for other users or other files, you have to change this name
some_unique_name = 'some-analysis-for-person-a'

# watch-history.json that was dowloaded from youtube (e.g. your kids and your own)
# if you want to analyze multiple files, you have to run this script multiple times with different files
youtube_watch_history_file = '/tmp/watch-history.json'

# directory where the generated files will be saved, a unique subdirectory for each input file will be created
output_dir = '/tmp/social_media_analysis/youtube/generated/'

# specify the year to analyze, or 'all' to analyze all years
# e.g. 2023 or 2024 or all
year_to_analyze = 'all'

# some videos are very long (e.g. music streams for background listening)
# and we want to ignore them
ignore_videos_longer_than_seconds = 7200

# YouTube only provides the total duration of a video, but not the duration watched
# adjust this factor to estimate the duration watched
# e.g. 1.0 = 100% watched, 0.5 = 50% watched
assume_all_videos_were_watched_to_factor = 1.0

# some videos are from channels that you don't want to analyze or pollute the statistics
# specify a list of regular expressions to match the channel name to ignore
ignore_videos_from_channel_regex = ['Emily.*', 'Zadec.*']

# ---------------------------------------------------

# ------------- DO NOT CHANGE BELOW (unless you know what you are doing) ----------------
# e.g /tmp/youtube_results-21fd2ff0510ae3aa7d5bdea50c26ed85
output_dir_unique = os.path.join(output_dir, some_unique_name)
video_details_download_folder = os.path.join(output_dir_unique, 'video_details_raw')