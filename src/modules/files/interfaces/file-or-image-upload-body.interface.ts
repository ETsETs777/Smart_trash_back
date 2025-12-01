/**
 * Interface for file or image upload body.
 */
export interface IFileOrImageUploadBody {
  /**
   * File original name.
   * The frontend should know that it should pass this, but it's not accounted for everywhere.
   * You can use file.originalname from Multer, but here problems with cyrillic.
   */
  filename?: string;
  /**
   * Description for file if needed.
   */
  description?: string;
}
