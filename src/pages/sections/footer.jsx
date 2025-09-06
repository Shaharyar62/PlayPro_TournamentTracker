import { ImageConstants } from "../../assets/images/ImageConstants";

const imageData = [
  { alt: "logo8", className: "", src: "/src/assets/images/logos/8.png" },
  { alt: "logo9", className: "", src: "/src/assets/images/logos/9.png" },
  { alt: "logo4", className: "", src: "/src/assets/images/logos/4.png" },
  { alt: "logo7", className: "", src: "/src/assets/images/logos/7.png" },
  { alt: "logo2", className: "", src: "/src/assets/images/logos/2.png" },
  { alt: "logo5", className: "", src: "/src/assets/images/logos/5.png" },
  { alt: "logo3", className: "", src: "/src/assets/images/logos/3.png" },
  { alt: "logo1", className: "", src: "/src/assets/images/logos/1.png" },
  { alt: "logo6", className: "", src: "/src/assets/images/logos/6.png" },
];

const Footer = () => {
  return (
    <>
      <div className="fixed bottom-0 left-0 w-full">
        <div className="flex justify-between">
          <img
            src={ImageConstants.appStore}
            className="rounded-[20px] w-[300px]"
            alt="App Store"
          />
          <div className="flex justify-center  flex-wrap  items-center   gap-[50px]">
            {imageData.map((image, index) => (
              <img
                key={index}
                alt={image.alt}
                className="h-15"
                src={image.src}
              />
            ))}
          </div>
          <img
            src={ImageConstants.googlePlay}
            className="rounded-[20px] w-[300px]"
            alt="Google Play"
          />
        </div>
      </div>
    </>
  );
};

export default Footer;
