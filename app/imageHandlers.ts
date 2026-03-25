export type ImageItem = {
  uri: any;
  description: string;
};
export function addImage(imageList: ImageItem[], newImage: ImageItem){
    return [... imageList, newImage]
}
export function deleteImage(imageList: ImageItem[], indexToRemove: number){
    return imageList.filter((item, index) => index !== indexToRemove);
}
export function updateImage(imageList: ImageItem[], updateIndex: number, image: ImageItem){
    return imageList.map((images, index) =>
        index === updateIndex ? image: images
    )
}
export const test = 123;