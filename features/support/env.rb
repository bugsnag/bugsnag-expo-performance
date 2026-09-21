BeforeAll do
  if Maze.config.farm == :bb
    Maze.config.android_app_files_directory = '/sdcard/Android/data/com.bugsnag.expo.fixture/files'
  end
  Maze.config.enforce_bugsnag_integrity = false
  Maze.config.receive_requests_wait = 60
end