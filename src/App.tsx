import { h } from "jsx-real-dom/src/lib/createelement";
import { conditionalMerge } from "jsx-real-dom/src/lib/utils/mergeChildren";
import {
  debounce,
  link,
  makeObservable,
  preventDefault,
} from "jsx-real-dom/src/lib/utils/obs";
import {
  dataChanged,
  deleteEventCommand,
  EventType,
  fetchEvents,
  fetchProjection,
  publishEvent,
  sendStateTransform,
} from "./utils";

type StateType = {
  source: string;
  lastChange: number;
};

const getSource = () => (location.hash ? location.hash.substring(1) : "jstest");
const [state, stateChanged] = makeObservable<StateType>({
  source: getSource(),
  lastChange: Date.now(),
});

addEventListener("hashchange", () => {
  state.source = getSource();
});

dataChanged.sub(
  debounce(() => {
    state.lastChange = Date.now();
  }, 20)
);

function Event({ key, ...event }: any) {
  return (
    <div class="event" data-key={key}>
      <pre>{JSON.stringify(event, null, 2)}</pre>
      <a
        class="button delete"
        onclick={() => deleteEventCommand({ ...state, event })}
      >
        X
      </a>
    </div>
  );
}
const getEventKey = (e: EventType, i: number) => ({
  ...e,
  key: `${e.eventName}-${i}`,
});

export function EventList() {
  const loadEvents = (data, cnt) =>
    fetchEvents(data).then(({ data }) =>
      conditionalMerge(
        Event,
        data.map(getEventKey),
        cnt,
        ({ dataset: { key } }) => key
      )
    );

  return (
    <div>
      <a
        class="button delete"
        onclick={preventDefault((e) => {
          e.target.nextSibling.classList.toggle("rev");
        })}
      >
        reverse
      </a>
      <div ref={link(stateChanged, loadEvents)} class="rev events"></div>
    </div>
  );
}

export function ProjectionData() {
  const loadProjection = (data: { source: string }, cnt: HTMLElement) => {
    fetchProjection(data).then((d) => {
      cnt.innerHTML = JSON.stringify(d, null, 2);
    });
  };

  return (
    <div>
      <pre ref={link(stateChanged, loadProjection)}></pre>
    </div>
  );
}

function getFormData<T extends { [key: string]: string }>({
  target,
}: SubmitEvent) {
  return target
    ? Array.from(target as HTMLFormElement).reduce(
        (data, elm: { id?: string; value?: string }) => {
          return elm.id && elm.value ? { ...data, [elm.id]: elm.value } : data;
        },
        {} as T
      )
    : {};
}

function js(data) {
  return JSON.stringify(data, null, 2);
}

const templateData = [
  { eventName: "update", data: js({ id: "a", name: "kalle" }) },
  { eventName: "birthday", data: js({ id: "a" }) },
  { eventName: "die", data: js({ id: "a" }) },
  { eventName: "linkImage", data: js({ id: "a", image: "slask.png" }) },
  {
    eventName: "create",
    data: js({ id: "e", name: "test", age: 0, shoeSize: 12 }),
  },
];

const getTemplateIndex = ({ target: { selectedIndex } }) =>
  templateData[selectedIndex];

const asInput = (id) =>
  document.getElementById(id) as (HTMLElement & { value?: string }) | null;

const setDataToInputs = (data: { [key: string]: string }) =>
  Object.entries(data).forEach(([key, value]) => (asInput(key)!.value = value));

export const sendEvent = (e: SubmitEvent) =>
  publishEvent(getFormData(e), state.source);
export const sendTemplate = (e: SubmitEvent) =>
  sendStateTransform(getFormData(e), state.source);
const templateChange = (e) => setDataToInputs(getTemplateIndex(e));

export const Template = () => {
  return (
    <select onchange={templateChange}>
      {...templateData.map(({ eventName }) => <option>{eventName}</option>)}
    </select>
  );
};
