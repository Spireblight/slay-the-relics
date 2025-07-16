import {
  CSSProperties,
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";

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

export function Card(props: {
  name: string;
  onClick: () => void;
  additionalClasses: string;
}) {
  let backgroundPosition = "0% 0%";
  if (props.name.includes("+")) {
    backgroundPosition = "100% 0%";
  }

  const cardStyle: CSSProperties = {
    backgroundImage: `url(${slaytabaseUrlForCard(props.name)})`,
    backgroundPosition: backgroundPosition,
  };
  return (
    <div
      style={cardStyle}
      className={props.additionalClasses}
      onClick={props.onClick}
    />
  );
}

export function CardView(props: {
  cards: string[];
  selectedIndex: number;
  setSelectedIndex: Dispatch<SetStateAction<number>>;
  display: string;
  setDisplay: Dispatch<SetStateAction<string>>;
  upgradeChecked: Map<number, boolean>;
  setUpgradeChecked: Dispatch<SetStateAction<Map<number, boolean>>>;
}) {
  if (props.cards.length < 1) {
    return <div></div>;
  }

  const card = props.cards[props.selectedIndex];
  const isUpgrade = (i: number) => {
    return props.upgradeChecked.get(i) ?? props.cards[i].includes("+");
  };
  const toggleUpgrade = (i: number) => {
    props.setUpgradeChecked((prev) => {
      const newMap = new Map(prev);
      newMap.set(i, !isUpgrade(i));
      return newMap;
    });
  };
  const resetUpgrade = (i: number) => {
    props.setUpgradeChecked((prev) => {
      const newMap = new Map(prev);
      newMap.delete(i);
      return newMap;
    });
  };

  const nextCard = () => {
    if (props.selectedIndex === props.cards.length - 1) {
      return;
    }
    props.setSelectedIndex((i) => i + 1);
  };
  const prevCard = () => {
    if (props.selectedIndex === 0) {
      return;
    }
    props.setSelectedIndex((i) => i - 1);
  };

  return (
    <div
      id={"card_view"}
      className={
        "absolute justify-center items-center w-screen h-screen " +
        props.display
      }
    >
      {props.selectedIndex > 0 && (
        <button onClick={prevCard} id={"card_view_prev_btn"}></button>
      )}
      {props.selectedIndex < props.cards.length - 1 && (
        <button onClick={nextCard} id={"card_view_next_btn"}></button>
      )}
      <Card
        name={
          isUpgrade(props.selectedIndex) ? card + "+" : card.replaceAll("+", "")
        }
        additionalClasses={"card-view-card"}
        onClick={() => {
          props.setDisplay("hidden");
          resetUpgrade(props.selectedIndex);
        }}
      ></Card>
      <div
        id={"card_view_checkbox"}
        className={
          isUpgrade(props.selectedIndex)
            ? "card-view-checkbox-checked"
            : "card-view-checkbox-unchecked"
        }
        onClick={() => toggleUpgrade(props.selectedIndex)}
      ></div>
    </div>
  );
}

export function CardGrid(props: {
  cards: string[];
  deckViewMode: string;
  setCardIndex: Dispatch<SetStateAction<number>>;
  setCardViewMode: Dispatch<SetStateAction<string>>;
}) {
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
          <Card
            key={"card-" + i}
            name={card}
            additionalClasses={"deck-card"}
            onClick={() => {
              props.setCardIndex(i);
              props.setCardViewMode("flex");
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function DeckButton(props: {
  cardCount: number;
  deckViewMode: string;
  setDeckViewMode: Dispatch<SetStateAction<string>>;
  setCardViewMode: Dispatch<SetStateAction<string>>;
  resetCardView: () => void;
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
          props.setCardViewMode("hidden");
          props.resetCardView();
        }
      }}
    ></button>
  );
}

export function DeckView(props: { cards: string[] }) {
  const [deckViewMode, setDeckViewMode] = useState("hidden");
  const [cardViewMode, setCardViewMode] = useState("hidden");
  const [cardIndex, setCardIndex] = useState(0);
  const [upgradeChecked, setUpgradeChecked] = useState<Map<number, boolean>>(
    new Map(),
  );

  const resetCardView = () => {
    setCardIndex(0);
    setUpgradeChecked(new Map());
  };
  const nextCard = () => {
    if (cardIndex === props.cards.length - 1) {
      return;
    }
    setCardIndex((i) => i + 1);
  };
  const prevCard = () => {
    if (cardIndex === 0) {
      return;
    }
    setCardIndex((i) => i - 1);
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (cardViewMode === "flex") {
          setCardViewMode("hidden");
          resetCardView();
        } else {
          setDeckViewMode("hidden");
          resetCardView();
        }
      } else if (e.key === "ArrowRight" && cardViewMode === "flex") {
        nextCard();
      } else if (e.key === "ArrowLeft" && cardViewMode === "flex") {
        prevCard();
      }
    },
    [
      cardViewMode,
      setCardViewMode,
      resetCardView,
      setDeckViewMode,
      prevCard,
      nextCard,
    ],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div>
      <DeckButton
        cardCount={props.cards.length}
        deckViewMode={deckViewMode}
        setDeckViewMode={setDeckViewMode}
        setCardViewMode={setCardViewMode}
        resetCardView={resetCardView}
      />
      <CardGrid
        cards={props.cards}
        deckViewMode={deckViewMode}
        setCardIndex={setCardIndex}
        setCardViewMode={setCardViewMode}
      />
      <CardView
        cards={props.cards}
        selectedIndex={cardIndex}
        setSelectedIndex={setCardIndex}
        display={cardViewMode}
        setDisplay={setCardViewMode}
        upgradeChecked={upgradeChecked}
        setUpgradeChecked={setUpgradeChecked}
      />
    </div>
  );
}
