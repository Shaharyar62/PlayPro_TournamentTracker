import { useTournamentImages } from "../../context/TournamentImagesContext";

export const Header = () => {
  const images = useTournamentImages();
  return (
    <div className="flex ml-[100px] mb-5 mr-[100px] justify-between items-center">
      <div className="text-center" style={{ width: "500px" }}>
        <img
          className="justify-self-start p-0"
          src={images.leftLogo}
          alt="Greenwich Padel"
          style={{ objectFit: "contain" }}
        />
      </div>

      <div className="text-center" style={{ width: "700px" }}>
        <img
          className="justify-self-end p-0"
          src={images.cupLogo}
          alt="Greenwich Padel"
        />
      </div>

      <div className="text-center" style={{ width: "500px" }}>
        <img
          className="justify-self-end p-0"
          src={images.rightLogo}
          alt="Playpro"
        />
      </div>
    </div>
  );
};

export default Header;
