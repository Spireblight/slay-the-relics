import {
  CSSProperties,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
} from "react";
import { KeywordTips, PowerTipBlock, TipBody } from "../Tip/Tip";
import { ReturnButton } from "../Buttons/Buttons";
import { Cards, LocalizationContext } from "../Localization/Localization";

type DeckType = "deck" | "draw" | "discard" | "exhaust";

export type CardData = string | [string, number];

function cardName(card: CardData): string {
  if (typeof card === "string") {
    return card;
  }
  return card[0];
}

function cardValue(card: CardData): number {
  if (typeof card === "string") {
    return 0;
  }
  return card[1];
}

function withCardName(card: CardData, fn: (n: string) => string): CardData {
  const newName: string = fn(cardName(card));
  if (typeof card === "string") {
    return newName;
  }
  return [newName, card[1]];
}

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

function lookupCard(name: string, cardsLoc: Cards): string {
  const normalName = name.replaceAll("+", "");
  const upgraded = name.includes("+");

  const cardLoc = cardsLoc[normalName];
  if (!cardLoc) {
    return "";
  }

  if (upgraded && cardLoc.UPGRADE_DESCRIPTION) {
    return cardLoc.UPGRADE_DESCRIPTION;
  }
  return cardLoc.DESCRIPTION;
}

export function Card(props: {
  data: CardData;
  character: string;
  onClick: () => void;
  additionalClasses: string;
}) {
  const name = cardName(props.data);
  const upgraded = name.includes("+");
  const slaytabaseName = formatForSlaytabase(name);

  let backgroundPosition = "0% 0%";
  if (upgraded) {
    backgroundPosition = "100% 0%";
  }
  const loc = useContext(LocalizationContext);

  const cardStyle: CSSProperties = {
    backgroundImage: `url(${slaytabaseUrlForCard(name)})`,
    backgroundPosition: backgroundPosition,
  };

  const description = lookupCard(name, loc.cards);
  const tips = KeywordTips(description, loc.keywords);
  const tooltipId = useId();

  let addDescription = "";
  switch (slaytabaseName) {
    case "geneticalgorithm":
      if (upgraded) {
        addDescription = description.replaceAll("!M!", "#g3");
      } else {
        addDescription = description.replaceAll("!M!", "2");
      }
      addDescription = addDescription.replaceAll(
        "!B!",
        cardValue(props.data).toString(10),
      );
      break;
    case "ritualdagger":
      if (upgraded) {
        addDescription = description.replaceAll("!M!", "#g5");
      } else {
        addDescription = description.replaceAll("!M!", "3");
      }
      addDescription = addDescription.replaceAll(
        "!D!",
        cardValue(props.data).toString(10),
      );
      break;
  }
  addDescription = addDescription
    .replaceAll("Block", "#yBlock")
    .replaceAll("Exhaust", "#yExhaust")
    .replaceAll("Fatal", "#yFatal");

  return (
    <div
      style={cardStyle}
      className={props.additionalClasses + " flex items-end justify-center"}
      onClick={props.onClick}
      data-tooltip-id={tooltipId}
    >
      {addDescription && (
        <div
          className={"w-[66%] h-[34%]"}
          style={{
            backgroundColor: "#404040",
            marginBottom: "8.1%",
            textAlign: "center",
          }}
        >
          <TipBody
            className={"card-text"}
            character={props.character}
            raw={addDescription}
          />
        </div>
      )}
      <PowerTipBlock
        magGlass={false}
        hitbox={tooltipId}
        tips={tips}
        character={props.character}
        noExpand={true}
        place={"right-start"}
      />
    </div>
  );
}

export function CardView(props: {
  cards: CardData[];
  selectedIndex: number;
  setSelectedIndex: Dispatch<SetStateAction<number>>;
  display: string;
  setDisplay: Dispatch<SetStateAction<string>>;
  upgradeChecked: Map<number, boolean>;
  setUpgradeChecked: Dispatch<SetStateAction<Map<number, boolean>>>;
  character: string;
}) {
  if (props.cards.length < 1) {
    return <div></div>;
  }

  const card = props.cards[props.selectedIndex];
  const isUpgrade = (i: number) => {
    return (
      props.upgradeChecked.get(i) ?? cardName(props.cards[i]).includes("+")
    );
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
    props.setSelectedIndex((i) => i + 1);
  };
  const prevCard = () => {
    props.setSelectedIndex((i) => i - 1);
  };

  const closeCard = () => {
    props.setDisplay("hidden");
    resetUpgrade(props.selectedIndex);
  };

  const prevBtnEnabled = props.selectedIndex > 0;
  const nextBtnEnabled = props.selectedIndex < props.cards.length - 1;

  return (
    <div
      className={
        props.display +
        " absolute w-full h-full justify-center items-center card-view"
      }
      onClick={closeCard}
    >
      <button
        onClick={(event) => {
          if (!prevBtnEnabled) {
            return;
          }
          event.stopPropagation();
          prevCard();
        }}
        id={"card_view_prev_btn"}
        className={prevBtnEnabled ? "prev_btn_enabled" : ""}
      />
      <div
        className={"flex flex-col w-[40%] h-full items-center justify-center"}
      >
        <Card
          data={withCardName(card, (name) => {
            return isUpgrade(props.selectedIndex)
              ? name + "+"
              : name.replaceAll("+", "");
          })}
          character={props.character}
          additionalClasses={"card-view-card"}
          onClick={closeCard}
        />
        <button
          id={"card_view_checkbox"}
          className={
            isUpgrade(props.selectedIndex)
              ? "card-view-checkbox-checked"
              : "card-view-checkbox-unchecked"
          }
          onClick={(event) => {
            event.stopPropagation();
            toggleUpgrade(props.selectedIndex);
          }}
        />
      </div>
      <button
        onClick={(event) => {
          if (!nextBtnEnabled) {
            return;
          }
          event.stopPropagation();
          nextCard();
        }}
        id={"card_view_next_btn"}
        className={nextBtnEnabled ? "next_btn_enabled" : ""}
      />
    </div>
  );
}

export function CardGrid(props: {
  cards: CardData[];
  deckViewMode: string;
  setCardIndex: Dispatch<SetStateAction<number>>;
  setCardViewMode: Dispatch<SetStateAction<string>>;
  character: string;
}) {
  return (
    <div
      className={props.deckViewMode + " absolute justify-center w-screen"}
      style={{
        top: "6.018%",
        height: "93.982%",
        zIndex: 10,
        overflowY: "scroll",
        backgroundColor: "rgba(0,0,0,0.85)",
      }}
    >
      <div
        className={"grid grid-cols-5 grid-flow-row-dense gap-2 w-2/3"}
        style={{
          zIndex: 10,
        }}
      >
        {props.cards.map((card, i) => (
          <Card
            key={"card-" + i}
            data={card}
            additionalClasses={"deck-card"}
            character={props.character}
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
  what: DeckType;
}) {
  const locationStyle: CSSProperties = {
    display: props.cardCount ? "block" : "none",
  };
  switch (props.what) {
    case "deck":
      locationStyle.top = "0%";
      locationStyle.right = "4.322%";
      break;
    case "draw":
      locationStyle.top = "89%";
      locationStyle.left = "2.322%";
      break;
    case "discard":
      locationStyle.top = "89%";
      locationStyle.left = "94.322%";
      break;
    case "exhaust":
      locationStyle.top = "78.5%";
      locationStyle.left = "94.56%";
      break;
  }

  return (
    <button
      style={locationStyle}
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

export function DeckView(props: {
  cards: CardData[];
  character: string;
  what: DeckType;
  enableCardView?: boolean;
}) {
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

  let closeText = "Close Deck";
  switch (props.what) {
    case "deck":
      closeText = "Close Deck";
      break;
    case "draw":
      closeText = "Close Draw Pile";
      break;
    case "discard":
      closeText = "Close Discard Pile";
      break;
    case "exhaust":
      closeText = "Close Exhaust Pile";
      break;
  }
  return (
    <div>
      {deckViewMode === "flex" && (
        <ReturnButton
          text={closeText}
          onClick={() => {
            setDeckViewMode("hidden");
            setCardViewMode("hidden");
            resetCardView();
          }}
        />
      )}
      <DeckButton
        what={props.what}
        cardCount={props.cards.length}
        deckViewMode={deckViewMode}
        setDeckViewMode={setDeckViewMode}
        setCardViewMode={setCardViewMode}
        resetCardView={resetCardView}
      />
      <CardGrid
        cards={props.cards}
        character={props.character}
        deckViewMode={deckViewMode}
        setCardIndex={setCardIndex}
        setCardViewMode={setCardViewMode}
      />
      {props.enableCardView && (
        <CardView
          character={props.character}
          cards={props.cards}
          selectedIndex={cardIndex}
          setSelectedIndex={setCardIndex}
          display={cardViewMode}
          setDisplay={setCardViewMode}
          upgradeChecked={upgradeChecked}
          setUpgradeChecked={setUpgradeChecked}
        />
      )}
    </div>
  );
}
