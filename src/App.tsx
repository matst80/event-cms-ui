import { useQuery, useState } from "jsx-real-dom";
import { h } from "jsx-real-dom/src/lib/createelement";
import {
  deleteEvent,
  fetchEvents,
  fetchProjection,
  listen,
  publishEvent,
} from "./utils";

function event(source) {
  return (event) => (
    <div>
      <pre>{JSON.stringify(event, null, 2)}</pre>
      <a onclick={() => deleteEvent(source, event)}>X</a>
    </div>
  );
}

function EventList({ source }) {
  const Event = event(source);
  const loadEvents = listen((cnt) => {
    fetchEvents(source).then(({ data }) => {
      cnt.replaceChildren(...data.map(Event));
    });
  });
  return (
    <div>
      <div ref={loadEvents}></div>
    </div>
  );
}

function ProjectionData({ source }) {
  const loadProjection = listen((cnt) => {
    fetchProjection(source).then((data) => {
      cnt.innerHTML = JSON.stringify(data, null, 2);
    });
  });
  return (
    <div>
      <pre ref={loadProjection}></pre>
    </div>
  );
}

function getFormData(form: HTMLFormElement) {
  return Array.from(form).reduce((data, elm) => {
    return elm.id && elm.value ? { ...data, [elm.id]: elm.value } : data;
  }, {} as any);
}

function App() {
  const source = "jstest";
  const sendEvent = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const { eventName, data } = getFormData(e.target);
    publishEvent(source, eventName, JSON.parse(data));
    return false;
  };
  return (
    <div>
      <header>
        <span>{source}</span>
      </header>
      <form onsubmit={sendEvent}>
        <input type="text" id="eventName" value="update"></input>
        <textarea id="data" value='{"id":"a","plupp":4}'></textarea>
        <button type="submit">Send</button>
      </form>
      <div class="flex">
        <ProjectionData source={source} />

        <EventList source={source} />
      </div>
    </div>
  );
}

export default App;
