import tiktoken
import sys
import base64

if (len(sys.argv) == 3):
    model = sys.argv[1]
    text = base64.b64decode(sys.argv[2]).decode('utf-8')

    enc = tiktoken.encoding_for_model(model)
    print(len(enc.encode(text)))


