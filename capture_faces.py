import cv2
import os

def capture_images(person_name, num_images=30):
    cam = cv2.VideoCapture(0)
    os.makedirs(f"dataset/{person_name}", exist_ok=True)
    count = 0

    while count < num_images:
        ret, frame = cam.read()
        if not ret:
            break
        cv2.imshow("Capturing Faces", frame)
        k = cv2.waitKey(1)

        if k % 256 == 32:  # Space key
            img_name = f"dataset/{person_name}/{count}.jpg"
            cv2.imwrite(img_name, frame)
            print(f"Saved: {img_name}")
            count += 1
        elif k % 256 == 27:  # ESC
            break

    cam.release()
    cv2.destroyAllWindows()


capture_images("Julia", num_images=40)
