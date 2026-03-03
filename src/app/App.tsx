import { periods } from "../periods";
import { TimelineWheel } from "../widgets/timelineWheel/TimelineWheel";
import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    }

  body {
      font-family: "PT Sans", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    }
`;

export function App() {
  return (
    <div>
      <GlobalStyle />
      <TimelineWheel title="Исторические даты" periods={periods} />
    </div>
  );
}
