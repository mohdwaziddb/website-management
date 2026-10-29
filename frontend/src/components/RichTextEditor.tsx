import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  Alignment,
  BlockQuote,
  Bold,
  ClassicEditor,
  Editor,
  Essentials,
  FileLoader,
  FontColor,
  FontSize,
  Heading,
  HorizontalLine,
  Image,
  ImageCaption,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Indent,
  Italic,
  Link,
  List,
  MediaEmbed,
  Paragraph,
  RemoveFormat,
  SourceEditing,
  Table,
  TableToolbar,
  Underline
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";
import { fileUrl, uploadFile } from "../lib/api";

/** Editor me image paste/upload -> hamara /api/files (tenant folder me save). */
function UploadAdapterPlugin(editor: Editor) {
  editor.plugins.get("FileRepository").createUploadAdapter = (loader: FileLoader) => ({
    upload: async () => {
      const file = await loader.file;
      if (!file) throw new Error("No file");
      const r = await uploadFile(file);
      return { default: fileUrl(r.url) };
    },
    abort: () => {}
  });
}

export default function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  return (
    <div className="prose-editor">
      <CKEditor
        editor={ClassicEditor}
        data={value}
        config={{
          licenseKey: "GPL",
          plugins: [
            Essentials, Paragraph, Heading, Bold, Italic, Underline, Link, List, Indent, BlockQuote, Alignment,
            FontSize, FontColor, RemoveFormat, HorizontalLine, Table, TableToolbar, MediaEmbed, SourceEditing,
            Image, ImageCaption, ImageResize, ImageStyle, ImageToolbar, ImageUpload
          ],
          extraPlugins: [UploadAdapterPlugin],
          toolbar: [
            "heading", "|", "bold", "italic", "underline", "fontSize", "fontColor", "|", "alignment",
            "bulletedList", "numberedList", "outdent", "indent", "|", "link", "uploadImage", "insertTable",
            "mediaEmbed", "blockQuote", "horizontalLine", "|", "removeFormat", "sourceEditing", "|", "undo", "redo"
          ],
          image: { toolbar: ["imageTextAlternative", "toggleImageCaption", "imageStyle:inline", "imageStyle:block", "imageStyle:side"] },
          table: { contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"] },
          mediaEmbed: { previewsInData: true }
        }}
        onChange={(_e, editor) => onChange(editor.getData())}
      />
    </div>
  );
}
