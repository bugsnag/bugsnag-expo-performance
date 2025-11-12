Then('the trace payload field {string} string attribute {string} equals the platform-dependent string:') do |field, attribute, platform_values|
  expected_value = get_expected_platform_value(platform_values)
  if !expected_value.eql?('@skip')
    check_attribute_equal_with_nullability field, attribute, 'stringValue', expected_value
  end
end

def get_expected_platform_value(platform_values)
  os = Maze::Helper.get_current_platform
  expected_value = Hash[platform_values.raw][os.downcase]
  raise("There is no expected value for the current platform \"#{os}\"") if expected_value.nil?

  expected_value
end

def get_attribute_value(field, attribute, attr_type)
  list = Maze::Server.list_for 'trace'
  attributes = Maze::Helper.read_key_path list.current[:body], "#{field}.attributes"
  attribute = attributes.find { |a| a['key'] == attribute }
  return nil if attribute.nil?

  value = attribute&.dig 'value', attr_type
  attr_type == 'intValue' && value.is_a?(String) ? value.to_i : value
end

def check_attribute_equal_with_nullability(field, attribute, attr_type, expected)
  actual = get_attribute_value field, attribute, attr_type

  case expected
  when '@null'
    Maze.check.nil(actual)
  when '@not_null'
    Maze.check.not_nil(actual)
  else
    Maze.check.equal(expected, actual)
  end
end
