import { useTournamentImages } from "../../context/TournamentImagesContext";

export const Header = () => {
  const images = useTournamentImages();
  return (
    <div className="flex px-[5vw] mb-5 justify-between items-center">
      <div
        className="flex-1 text-center"
        style={{ maxWidth: "clamp(260px, 26vw, 1500px)" }}
      >
        <img
          className="justify-self-start p-0"
          src={images.leftLogo}
          alt="Greenwich Padel"
          style={{
            objectFit: "contain",
            maxHeight: "var(--display-logo-header-h)",
            width: "100%",
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
          alt="Greenwich Padel"
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
          alt="Playpro"
          style={{
            objectFit: "contain",
            maxHeight: "var(--display-logo-header-h)",
            width: "100%",
          }}
        />
      </div>
    </div>
  );
};

export default Header;
