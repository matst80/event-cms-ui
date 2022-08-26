import { pubsub } from "jsx-real-dom/src/lib/utils/pubsub";

const baseUrl = "https://cms.tornberg.me/";
const headers = {
  "content-type": "application/json",
};

export const dataChanged = pubsub();

// const delay =
//   (time = 200) =>
//   () =>
//     new Promise((res) => setTimeout(res, time));

// const debounce = (time=200) => {
//   let timer =
//   return ()=>{}
// }

export const eventsChanged = dataChanged.pub;
export type EventType = { eventName: string; id?: string; [key: string]: any };
export const fetchEvents = ({
  source,
}: SourceType): Promise<{ end: number; data: EventType[] }> =>
  fetch(baseUrl + "replay/" + source).then((d) => d.json());

export type Collection = {
  end: number;
  [key: string]: any;
};

export type SourceType = {
  source?: string;
};

export const fetchProjection = ({
  source,
}: SourceType): Promise<Collection> => {
  console.log("do fetch projection", source);
  return fetch(baseUrl + source).then((d) => d.json());
};

export const deleteEventCommand = ({
  source,
  event,
}: {
  source: string;
  event: EventType;
}): Promise<any> => {
  // console.log(source, JSON.stringify(data));
  return fetch(baseUrl + "replay/" + source, {
    method: "DELETE",
    headers,
    body: JSON.stringify(event),
  }).then(eventsChanged);
};

export type PublishType = {
  eventName?: string;
  data?: string;
};

export const publishEvent = (
  { eventName, data }: { eventName?: string; data?: string },
  source: string
) => {
  if (data && eventName) {
    const body = JSON.stringify(JSON.parse(data));
    return fetch(baseUrl + source + "/" + eventName, {
      method: "POST",
      headers,
      body,
    }).then(eventsChanged);
  }
  return Promise.reject();
};

export const sendStateTransform = (
  { name, code }: { name?: string; code?: string },
  source: string
) => {
  return fetch(`${baseUrl}transform/${source}/${name}`, {
    method: "PUT",
    body: code,
  }).then(eventsChanged);
};

// export function listen(fn) {
//   return (...args) => {
//     fn(...args);
//     dataChanged.sub((data) => fn(...args, data));
//   };
// }
