import { useTournamentImages } from "../../context/TournamentImagesContext";

const SIDE_LOGO_STYLE = {
  objectFit: "contain",
  height: "var(--display-logo-header-h)",
  width: "auto",
  maxWidth: "none",
  flexShrink: 0,
};

export const Header = () => {
  const images = useTournamentImages();
  return (
    <div
      className="flex mb-5 justify-between items-center"
      style={{
        paddingLeft: "var(--display-header-padding-h)",
        paddingRight: "var(--display-header-padding-h)",
      }}
    >
      <div className="flex-1 flex justify-start items-center overflow-visible">
        <img
          className="p-0"
          src={images.leftLogo}
          alt=""
          style={SIDE_LOGO_STYLE}
        />
      </div>

      <div className="flex-[2] flex justify-center items-center overflow-visible">
        <img
          className="p-0"
          src={images.cupLogo}
          alt=""
          style={{
            objectFit: "contain",
            height: "var(--display-logo-cup-h)",
            width: "auto",
            maxWidth: "none",
            flexShrink: 0,
          }}
        />
      </div>

      <div className="flex-1 flex justify-end items-center overflow-visible">
        <img
          className="p-0"
          src={images.rightLogo}
          alt=""
          style={SIDE_LOGO_STYLE}
        />
      </div>
    </div>
  );
};

export default Header;
