BeforeAll do
  if Maze.config.farm == :bb
    Maze.config.android_app_files_directory = '/data/local/tmp'
  end
  Maze.config.enforce_bugsnag_integrity = false
  Maze.config.receive_requests_wait = 60
end

# Maze Runner launches the app when it creates the Appium session, which happens before it
# pushes this session's fixture_config.json to the device. The config file is written outside
# the app sandbox on Android (/data/local/tmp) so it survives between sessions, meaning the
# fixture can start up holding the Maze Runner address of a *previous* run on that device and
# deliver its payloads there instead of to us. When that happens no requests arrive at all and
# the run fails with "Expected 1 sampling request but received 0".
#
# Restart the app once the config file for this session has been written, so the fixture always
# reads the current address. Registering via Maze.hooks.before guarantees this runs after Maze
# Runner's own before hook, which is what writes the file.
Maze.hooks.before do
  next unless Maze.mode == :appium
  next unless Maze.config.browser.nil?

  app_manager = Maze::Api::Appium::AppManager.new

  begin
    # Do not fail the driver if the app was not running - we are about to launch it anyway
    app_manager.terminate(false)
  rescue StandardError => e
    # If the app was not running there is nothing to terminate, so carry on and launch it
    $logger.warn "Failed to terminate the app before relaunching it: #{e.message}"
  end

  # Discard anything the app sent before it had this session's address
  Maze::Server.reset!

  app_manager.activate
end
