import { createResource, For } from "solid-js";

const baseUrl = "http://localhost:3000/";

const fetchEvents = (source: string): Promise<{ end: number; data: any[] }> =>
  fetch(baseUrl + "replay/" + source).then((d) => d.json());

const fetchProjection = (source: string): Promise<any> =>
  fetch(baseUrl + source).then((d) => d.json());

const deleteEvent = (source: string, data: any) =>
  fetch(baseUrl + "replay/" + source, {
    method: "DELETE",
    body: JSON.stringify(data),
  });

function EventList({ source }) {
  const [events] = createResource(source, () => fetchEvents(source));
  return (
    <div>
      <span>{events.loading && "Loading..."}</span>
      <For each={events()?.data}>
        {(evt, i) => (
          <div>
            <pre>{JSON.stringify(evt, null, 2)}</pre>
            <a onclick={() => deleteEvent(source, evt)}>X</a>
          </div>
        )}
      </For>
    </div>
  );
}

function ProjectionData({ source }) {
  const [projection] = createResource("projection-" + source, () =>
    fetchProjection(source)
  );
  return (
    <div>
      <pre>{JSON.stringify(projection(), null, 2)}</pre>
    </div>
  );
}

function App() {
  const source = "jstest";
  return (
    <div>
      <header>
        <span>{source}</span>
      </header>
      <div class="flex">
        <ProjectionData source={source} />

        <EventList source={source} />
      </div>
    </div>
  );
}

export default App;
