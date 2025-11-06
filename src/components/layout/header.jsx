import { ImageConstants } from "../../assets/images/ImageConstants";

export const Header = () => {
  return (
    <div className="flex justify-between items-center">
      <div className="text-center" style={{ width: "400px" }}>
        <img
          width={400}
          className="justify-self-start p-5"
          src={ImageConstants.premierwhite}
          alt="Premier Club"
        />
      </div>

      <div className="text-center">
        <img
          width={220}
          className="justify-self-end p-5"
          src={ImageConstants.premiercup}
          alt="Playpro"
        />
      </div>

      <div className="text-center" style={{ width: "400px" }}>
        <img
          width={300}
          className="justify-self-end p-5"
          src={ImageConstants.playproWhite}
          alt="Playpro"
        />
      </div>
    </div>
  );
};

export default Header;
