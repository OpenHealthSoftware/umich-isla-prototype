import MySQLdb
import MySQLdb.cursors
import config

def connect_to_database():
  options = {
    'host': config.sql['host'],
    'user': config.sql['user'],
    'passwd': config.sql['password'],
    'db': config.sql['db'],
    'cursorclass' : MySQLdb.cursors.DictCursor
  }
  db = MySQLdb.connect(**options)
  db.autocommit(True)
  return db

db = connect_to_database()