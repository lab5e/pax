--
--

CREATE TABLE IF NOT EXISTS devices (
	id		TEXT PRIMARY KEY NOT NULL,
	name	TEXT NOT NULL,
	lat		REAL NOT NULL,
	lon		REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS samples (
	device_id			TEXT NOT NULL,
	message_id			TEXT NOT NULL,
	timestamp			INTEGER NOT NULL,
	bluetooth_count 	INTEGER NOT NULL,
	wifi_count			INTEGER NOT NULL,
	seq					INTEGER NOT NULL,
	uptime_seconds		INTEGER NOT NULL,
	core_temperature 	REAL NOT  NULL,

	FOREIGN KEY(device_id) REFERENCES devices(id)
);

CREATE INDEX samples_device_id ON samples(device_id);
CREATE INDEX samples_timestamp ON samples(timestamp);
CREATE UNIQUE INDEX samples_message_id ON samples(message_id);