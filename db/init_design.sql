Table Role
{
  id integer [primary key]
  name varchar(20) [not null]
}

Table Version
{
  root_message_id UUID [null, ref: > Message.id]
  conversation_id UUID [not null, ref: > Conversation.id]
  parent_version_id UUID [null, ref: > Version.id]
  id UUID [primary key]
}

Table Conversation
{
  id UUID [primary key]
  title varchar(100) [not null]
  created_at datetime
  modified_at datetime
  active_version_id UUID [null, ref: > Version.id]
  active boolean [default: false]
}

Table Message
{
  id UUID [primary key]
  content text [not null]
  role_id UUID [not null, ref: > Role.id]
  created_at datetime
  version_id UUID [not null, ref: > Version.id]
}
