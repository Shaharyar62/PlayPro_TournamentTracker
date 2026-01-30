import { ImageConstants } from "../../assets/images/ImageConstants";

export const Header = () => {
  return (
    <div className="flex ml-[100px] mr-[100px] justify-between items-center">
      <div className="text-center" style={{ width: "400px" }}>
        <img
          className="justify-self-start p-0"
          src={ImageConstants.leftLogo}
          alt="Greenwich Padel"
          style={{ height: "175px", objectFit: "contain" }}
        />
      </div>

      <div className="text-center">
        <img
          width={1120}
          className="justify-self-end p-0"
          src={ImageConstants.cupLogo}
          alt="Greenwich Padel"
        />
      </div>

      <div className="text-center" style={{ width: "400px" }}>
        <img
          width={350}
          className="justify-self-end p-0"
          src={ImageConstants.rightLogo}
          alt="Playpro"
        />
      </div>
    </div>
  );
};

export default Header;
