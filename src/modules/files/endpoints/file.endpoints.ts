import { insertParamsIntoUrl } from 'src/common/insert-params-into-url';
import { FileEntity } from 'src/entities/files/file.entity';

/**
 * Endpoints of FileController.
 */
export class FileEndpoints {
  public static readonly rootEndpoint = '/files' as const;

  public static readonly childFileUpload = '/upload' as const;

  public static readonly childGetFileStream = '/:id' as const;

  public static readonly S3_BASE_PATH = 'files' as const;

  // Upload a file
  public static readonly routeFileUpload =
    `${this.rootEndpoint}${this.childFileUpload}` as const;

  // Get a file
  public static readonly routeGetFileS3Url =
    `${this.rootEndpoint}${this.childGetFileStream}` as const;

  // Get a file from S3
  public static readonly S3_OBJECT_KEY =
    `${this.S3_BASE_PATH}${this.childGetFileStream}` as const;

  // Get a url for download file from S3 storage
  public static getFileS3Url(file: Pick<FileEntity, 'id' | 'ext'>): string {
    return insertParamsIntoUrl(this.routeGetFileS3Url, {
      id: file.id + file.ext,
    });
  }

  /**
   * Get file key in current S3 bucket.
   * @param file - FileStoreEntity
   * @return string - file key in S3 bucket.
   */
  public static getS3ObjectKey(file: Pick<FileEntity, 'id' | 'ext'>): string {
    return insertParamsIntoUrl(this.S3_OBJECT_KEY, {
      id: file.id + file.ext,
    });
  }
}
