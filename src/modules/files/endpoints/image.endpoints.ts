import { insertParamsIntoUrl } from 'src/common/insert-params-into-url';

/**
 * Endpoints of ImageController.
 */
export class ImageEndpoints {
  public static readonly rootEndpoint = '/images' as const;

  public static readonly rootEndpointForS3 = 'images' as const;

  public static readonly childImageView = '/image/:id' as const;

  public static readonly childImageDownload = '/:id' as const;

  public static readonly childAvatarGet = '/avatar/:id' as const;

  public static readonly childImageUpload = '/upload' as const;

  public static readonly childImageUpdate = '/update/:id/:angle' as const;

  // Upload an image
  public static readonly routeImageUpload =
    `${this.rootEndpoint}${this.childImageUpload}` as const;

  // Update an image
  public static readonly routeImageUpdate =
    `${this.rootEndpoint}${this.childImageUpdate}` as const;

  // View an image
  public static readonly routeImageView =
    `${this.rootEndpoint}${this.childImageView}` as const;

  // View an avatar image from S3
  public static readonly routeAvatarGet =
    `${this.rootEndpoint}${this.childAvatarGet}` as const;

  // Download an avatar image
  public static readonly routeImageDownload =
    `${this.rootEndpoint}${this.childImageDownload}` as const;

  // View an image
  public static imageView(id: string): string {
    return insertParamsIntoUrl(this.rootEndpoint + this.childImageView, {
      id,
    });
  }

  // Download an image
  public static imageDownload(id: string): string {
    return insertParamsIntoUrl(this.rootEndpoint + this.childImageDownload, {
      id,
    });
  }

  // View an avatar
  public static avatarGet(id: string): string {
    return insertParamsIntoUrl(this.routeAvatarGet, {
      id,
    });
  }

  // Update an image
  public static imageUpdate(id: string, angle: number): string {
    return insertParamsIntoUrl(this.rootEndpoint + this.childImageUpdate, {
      id,
      angle,
    });
  }

  /**
   Get image file key in current S3 bucket.
   * @param image - ImageStoreEntity
   * @param wantAvatar - If you need to get avatar image key.
   */
  public static imageGetS3Key(id: string, wantAvatar = false): string {
    return `${this.rootEndpointForS3}/${id}${wantAvatar ? '_avatar' : ''}.jpg`;
  }
}
