import { ImageConstants } from "../../assets/images/ImageConstants";

export const Header = () => {
  return (
    <div className="flex justify-between items-center">
      <div className="text-center" style={{ width: "400px" }}>
        <img
          width={400}
          className="justify-self-start p-0"
          src={ImageConstants.leftLogo}
          alt="Greenwich Padel"
          style={{ height: "165px", objectFit: "contain" }}
        />
      </div>

      <div className="text-center">
        <img
          width={400}
          className="justify-self-end p-5"
          src={ImageConstants.cupLogo}
          alt="Greenwich Padel"
        />
      </div>

      <div className="text-center" style={{ width: "400px" }}>
        <img
          width={350}
          className="justify-self-end p-5"
          src={ImageConstants.playpro}
          alt="Playpro"
        />
      </div>
    </div>
  );
};

export default Header;
