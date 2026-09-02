import { useTournamentImages } from "../../context/TournamentImagesContext";

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
      <div
        className="flex-1 text-center"
        style={{ maxWidth: "clamp(260px, 26vw, 1500px)" }}
      >
        <img
          className="justify-self-start p-0"
          src={images.leftLogo}
          alt={null}
          style={{
            objectFit: "contain",
            maxHeight: "var(--display-logo-header-h)",
            
          }}
        />
      </div>

      <div
        className="flex-1 text-center"
        style={{ maxWidth: "clamp(360px, 36.5vw, 1700px)" }}
      >
        <img
          className="justify-self-end p-0"
          src={images.cupLogo}
          alt={null}
          style={{
            objectFit: "contain",
            maxHeight: "var(--display-logo-cup-h)",
            width: "100%",
          }}
        />
      </div>

      <div
        className="flex-1 text-center"
        style={{ maxWidth: "clamp(260px, 26vw, 1500px)" }}
      >
        <img
          className="justify-self-end p-0"
          src={images.rightLogo}
          alt={null}
          style={{
            objectFit: "contain",
            maxHeight: "var(--display-logo-header-h)",
            
          }}
        />
      </div>
    </div>
  );
};

export default Header;
