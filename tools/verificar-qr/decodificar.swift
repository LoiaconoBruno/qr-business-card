// Decodifica los QR de los PNG que recibe como argumentos e imprime "archivo\tcontenido".
import Foundation
import CoreImage

let detector = CIDetector(ofType: CIDetectorTypeQRCode, context: nil, options: [CIDetectorAccuracy: CIDetectorAccuracyHigh])!
for path in CommandLine.arguments.dropFirst() {
    guard let img = CIImage(contentsOf: URL(fileURLWithPath: path)) else { print("\(path)\tERROR_IMAGEN"); continue }
    let feats = detector.features(in: img).compactMap { $0 as? CIQRCodeFeature }
    if let msg = feats.first?.messageString {
        let escaped = msg.replacingOccurrences(of: "\r", with: "\\r").replacingOccurrences(of: "\n", with: "\\n")
        print("\(path)\t\(escaped)")
    } else {
        print("\(path)\tNO_DETECTADO")
    }
}
