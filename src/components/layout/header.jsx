import { useTournamentImages } from "../../context/TournamentImagesContext";

export const Header = () => {
  const images = useTournamentImages();
  return (
    <div className="flex ml-[100px] mr-[100px] justify-between items-center">
      <div className="text-center" style={{ width: "500px" }}>
        <img
          className="justify-self-start p-0"
          src={images.leftLogo}
          alt="Greenwich Padel"
          style={{ objectFit: "contain" }}
        />
      </div>

      <div className="text-center">
        <img
          width={520}
          className="justify-self-end p-0"
          src={images.cupLogo}
          alt="Greenwich Padel"
        />
      </div>

      <div className="text-center" style={{ width: "500px" }}>
        <img
          width={350}
          className="justify-self-end p-0"
          src={images.rightLogo}
          alt="Playpro"
        />
      </div>
    </div>
  );
};

export default Header;
