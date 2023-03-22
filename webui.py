from subprocess import Popen, PIPE
import signal


try:
    backend = Popen('npm run --silent dev', shell=True, cwd='./server', stderr=PIPE)
    frontend = Popen('npm run --silent dev', shell=True, cwd='./app', stderr=PIPE)
    backend.wait()
    frontend.wait()
except KeyboardInterrupt:
    backend.send_signal(signal.SIGINT)
    frontend.send_signal(signal.SIGINT)
    backend.wait()
    frontend.wait()

