import { h } from "jsx-real-dom/src/lib/createelement";
import { preventDefault } from "jsx-real-dom/src/lib/utils/obs";
import {
  sendTemplate,
  sendEvent,
  Template,
  EventList,
  ProjectionData,
} from "./App";

document.getElementById("template")?.replaceWith(<Template />);
document.forms[0].addEventListener("submit", preventDefault(sendEvent));
document.forms[1].addEventListener("submit", preventDefault(sendTemplate));
document
  .getElementById("root")
  ?.replaceChildren(<ProjectionData />, <EventList />);
