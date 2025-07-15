import { CSSProperties, Dispatch, SetStateAction, useState } from "react";

const CARD_BASE_WIDTH = 12.361; //rem
const CARD_BASE_HEIGHT = 15.926; //rem
const DECK_VIEW_Y_MARGIN = 0.55; // rem
const DECK_VIEW_X_OFFSET = 13.541; // rem
const DECK_VIEW_Y_OFFSET = 3; // rem
const CARD_HOVER_SCALE = 1.32;

const DECK_VIEW_CARD_PREVIEW_SCALE = 0.95;
const DECK_VIEW_CARD_PREVIEW_WIDTH =
  CARD_BASE_WIDTH * DECK_VIEW_CARD_PREVIEW_SCALE;
const DECK_VIEW_CARD_PREVIEW_X_OFFSET = -0.8; // rem
const DECK_VIEW_CARD_PREVIEW_Y_OFFSET = 0.15;

function formatForSlaytabase(val: string): string {
  return val
    .split("+")[0]
    .replaceAll(":", "-")
    .replaceAll("'", "")
    .replaceAll(" ", "")
    .toLowerCase();
}

function slaytabaseUrlForCard(card: string): string {
  const formattedCard = encodeURI(formatForSlaytabase(card));
  return `https://raw.githubusercontent.com/OceanUwU/slaytabase/refs/heads/main/docs/slay%20the%20spire/cards/${formattedCard}.png`;
}

export function Card(props: { name: string }) {
  let backgroundPosition = "0% 0%";
  if (props.name.includes("+")) {
    backgroundPosition = "100% 0%";
  }

  const cardStyle: CSSProperties = {
    width: `${CARD_BASE_WIDTH}rem`,
    height: `${CARD_BASE_HEIGHT}rem`,
    backgroundImage: `url(${slaytabaseUrlForCard(props.name)})`,
    backgroundPosition: backgroundPosition,
    backgroundSize: "cover",
  };
  return <div style={cardStyle} />;
}

export function CardGrid(props: { cards: string[]; deckViewMode: string }) {
  return (
    <div
      className={props.deckViewMode + " absolute justify-center w-screen"}
      style={{
        top: "6.018%",
        height: "93.982%",
        zIndex: 10,
        overflow: "scroll",
        backgroundColor: "rgba(0,0,0,0.9)",
      }}
    >
      <div
        className={"grid grid-cols-5 grid-flow-row-dense"}
        style={{
          maxWidth: "fit-content",
          zIndex: 10,
        }}
      >
        {props.cards.map((card, i) => (
          <Card key={"card-" + i} name={card} />
        ))}
      </div>
    </div>
  );
}

export function DeckButton(props: {
  cardCount: number;
  deckViewMode: string;
  setDeckViewMode: Dispatch<SetStateAction<string>>;
}) {
  return (
    <button
      style={{
        display: props.cardCount ? "block" : "none",
      }}
      className={"button-border"}
      id={"deck_button"}
      onClick={() => {
        if (props.deckViewMode === "hidden") {
          props.setDeckViewMode("flex");
        } else {
          props.setDeckViewMode("hidden");
        }
      }}
    ></button>
  );
}

export function DeckView(props: { cards: string[] }) {
  const [deckViewMode, setDeckViewMode] = useState("hidden");
  return (
    <div
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setDeckViewMode("hidden");
        }
      }}
    >
      <DeckButton
        cardCount={props.cards.length}
        deckViewMode={deckViewMode}
        setDeckViewMode={setDeckViewMode}
      />
      <CardGrid cards={props.cards} deckViewMode={deckViewMode} />
    </div>
  );
}
