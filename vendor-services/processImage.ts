// vendor-services/processImage.ts
export async function processImageTo3D(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("No canvas context");

        canvas.width = img.width;
        canvas.height = img.height;

        // Background cleanup
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Shadow + perspective skew
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.35)";
        ctx.shadowBlur = 25;
        ctx.shadowOffsetX = 20;
        ctx.shadowOffsetY = 20;
        ctx.setTransform(1, 0.1, -0.1, 1, 0, 0);

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        canvas.toBlob((blob) => {
          if (!blob) return reject("Failed to create 3D image blob");
          const cleanedFile = new File([blob], `3d-${file.name}`, { type: "image/png" });
          resolve(cleanedFile);
        }, "image/png");
      };

      img.onerror = () => reject("Image load error");
    };

    reader.onerror = () => reject("File read error");
  });
}
