import bodyParser from 'body-parser';
import express from 'express';

const app = express();

app.use(bodyParser.json());

type Guest = {
  id: string;
  firstName: string;
  lastName: string;
  deadline?: string;
  attending: string;
};

let id = 1;
let eventId = 1;

const guestList: Guest[] = [];

// Enable CORS
app.use(function (_req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept',
  );
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, DELETE, OPTIONS',
  );
  next();
});

// Events
type Event = {
  eventId: string;
  eventName: string;
  eventLocation: string;
  eventGuestList: Guest[];
};

const eventList: Event[] = [];

// Created one entry for test purposes
eventList.push({
  eventId: '100',
  eventName: 'bla',
  eventLocation: 'asdkfl',
  eventGuestList: [
    {
      id: '100-100',
      firstName: 'firstName',
      lastName: 'lastName',
      deadline: '',
      attending: 'false',
    },
  ],
});

// New Event
app.post('/newEvent', function (req, res) {
  if (!req.body.eventName || !req.body.eventLocation) {
    res.status(400).json({
      errors: [{ message: 'Please enter an event name and location.' }],
    });
    return;
  }

  if (Object.keys(req.body).length > 3) {
    res.status(400).json({
      errors: [
        {
          message:
            'Request body contains more than event name and location properties',
        },
      ],
    });
    return;
  }

  const event = {
    eventId: String(eventId++),
    eventName: req.body.eventName,
    eventLocation: req.body.eventLocation,
    eventGuestList: [],
  };

  eventList.push(event);
  res.json(event);
});

// Get all events
app.get('/events', function (_req, res) {
  res.json(eventList);
});

// Get all event guests
app.get('/allEventGuests/', function (_req, res) {
  if (!_req.query.id) {
    res.status(400).json({
      errors: [{ message: 'Request body missing an event id' }],
    });
    return;
  }

  const tempEvent = eventList.find((element) => {
    return element.eventId === _req.query.id;
  });

  res.json(tempEvent?.eventGuestList);
});

// Add new guest to event
app.post('/addNewGuestToEvent', function (req, res) {
  if (!req.body.eventId || !req.body.firstName || !req.body.lastName) {
    res.status(400).json({
      errors: [{ message: 'No event id, first or last name given.' }],
    });
    return;
  }

  if (Object.keys(req.body).length > 4) {
    res.status(400).json({
      errors: [
        {
          message:
            'Request body contains more than event id, first and last name',
        },
      ],
    });
    return;
  }

  const tempEvent = eventList.find((element) => {
    return element.eventId === req.body.eventId;
  });

  const guest = {
    id: tempEvent?.eventId + '-' + String(id++),
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    ...(req.body.deadline ? { deadline: req.body.deadline } : {}),
    attending: 'false',
  };

  tempEvent?.eventGuestList.push(guest);
  res.json(guest);
});

// Modify a single event guest
app.patch('/ModifyEG/:guestId', function (req, res) {
  const allowedKeys = ['firstName', 'lastName', 'deadline', 'attending'];
  const difference = Object.keys(req.body).filter(
    (key) => !allowedKeys.includes(key),
  );

  if (difference.length > 0) {
    res.status(400).json({
      errors: [
        {
          message: `Request body contains more than allowed properties (${allowedKeys.join(
            ', ',
          )}). The request also contains these extra keys that are not allowed: ${difference.join(
            ', ',
          )}`,
        },
      ],
    });
    return;
  }

  const eventId = req.params.guestId.split('-')[0];
  const event = eventList.find((element) => {
    return element.eventId === eventId;
  });

  const guest = event?.eventGuestList.find(
    (currentGuest) => currentGuest.id === req.params.guestId,
  );

  if (!guest) {
    res
      .status(404)
      .json({ errors: [{ message: `Guest ${req.params.guestId} not found` }] });
    return;
  }

  if (req.body.firstName) guest.firstName = req.body.firstName;
  if (req.body.lastName) guest.lastName = req.body.lastName;
  if (req.body.deadline || req.body.deadline === '')
    guest.deadline = req.body.deadline;
  if ('attending' in req.body) guest.attending = req.body.attending;
  res.json(guest);
});

// Delete a single event guest
app.delete('/eventGuest/:guestId', function (req, res) {
  const eventId = req.params.guestId.split('-')[0];
  const event = eventList.find((element) => {
    return element.eventId === eventId;
  });

  const guest = event?.eventGuestList.find(
    (currentGuest) => currentGuest.id === req.params.guestId,
  );

  if (!guest) {
    res
      .status(404)
      .json({ errors: [{ message: `Guest ${req.params.guestId} not found` }] });
    return;
  }

  event.eventGuestList.splice(event.eventGuestList.indexOf(guest), 1);
  res.json(guest);
});

// Delete all attending event guests
app.delete('/deleteAttendingEventGuests/:eventId', function (req, res) {
  const event = eventList.find(
    (element) => element.eventId === req.params.eventId,
  );

  const eventGuestsNotAttending = event?.eventGuestList.filter(
    (currentGuest) => !currentGuest.attending,
  );

  eventList.forEach((eventElement) => {
    if (eventElement.eventId === event.eventId) {
      eventElement.eventGuestList.splice(
        0,
        eventElement.eventGuestList.length,
        ...eventGuestsNotAttending,
      );
    }
  });

  res.json('Deleted all attending guests.');
});

// Delete an event
app.delete('/deleteEvent/:eventId', function (req, res) {
  const eventId = req.params.eventId;
  let deletedEvent;
  if (!eventId) {
    res.status(404).json({ errors: [{ message: `No event ID given` }] });
    return;
  }

  const tempEventList = eventList.filter((element) => {
    if (element.eventId === eventId) {
      deletedEvent = element;
      return false;
    } else {
      return true;
    }
  });

  eventList.splice(0, eventList.length, ...tempEventList);

  res.json(deletedEvent);
});

app.listen(process.env.PORT || 5000, () => {
  console.log('🚀 Guest list server started on http://localhost:5000');
});
