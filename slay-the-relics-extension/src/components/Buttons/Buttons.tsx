export function ReturnButton(props: { onClick: () => void; text: string }) {
  return (
    <button className={"return_btn text-yellow"} onClick={props.onClick}>
      {props.text}
    </button>
  );
}
